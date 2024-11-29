const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

// Use the stealth plugin to make Puppeteer less detectable
puppeteer.use(StealthPlugin());

(async () => {
    const invoicesDir = path.join(__dirname, 'invoices');

    // Create the invoices directory if it doesn't exist
    if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
        console.log(`Created directory: ${invoicesDir}`);
    }

    const browser = await puppeteer.launch({
        headless: false,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1200,800'],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    try {
        // Navigate to ChatGPT homepage
        await page.goto('https://chatgpt.com', { waitUntil: 'networkidle2' });
        console.log('Navigated to ChatGPT homepage.');

        // Click the "Log in" button using page.evaluate()
        await page.evaluate(() => {
            const loginButton = Array.from(document.querySelectorAll('div.flex.items-center.justify-center'))
                .find((el) => el.textContent.trim() === 'Log in');
            if (loginButton) {
                loginButton.click();
            } else {
                throw new Error('Log in button not found');
            }
        });
        console.log('Clicked Log in button.');

        // Wait for navigation to the login page
        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        // Fill in the email field
        await page.waitForSelector('#email-input', { timeout: 60000 });
        console.log('Email input field found.');
        await page.type('#email-input', 'youremail', { delay: 100 });
        await page.click('.continue-btn');
        console.log('Email entered and Continue clicked.');

        // Fill in the password field
        await page.waitForSelector('#password', { timeout: 60000 });
        console.log('Password input field found.');
        await page.type('#password', 'yourpass', { delay: 100 });

        // Submit the login form
        await page.evaluate(() => {
            const buttons = document.querySelectorAll('button[type="submit"]');
            buttons.forEach((button) => {
                if (button.innerText.trim() === 'Continue') {
                    button.click();
                }
            });
        });
        console.log('Login form submitted.');

        // Wait for the navigation to complete
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        console.log('Logged in successfully.');

        // Navigate to pricing page
        await page.goto('https://chatgpt.com/#pricing', { waitUntil: 'networkidle2' });
        console.log('Navigated to Pricing page.');

        // Wait and click the "Manage my subscription" link
        const manageSubscriptionSelector = 'a.px-2.underline';
        await page.waitForSelector(manageSubscriptionSelector, { timeout: 90000 });
        const manageSubscriptionElement = (await page.$$(manageSubscriptionSelector))[0];
        if (manageSubscriptionElement) {
            await manageSubscriptionElement.click();
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
            console.log('Navigated to subscription management page.');
        } else {
            throw new Error('Manage my subscription link not found');
        }

        // Load all invoices
        let viewMoreButton;
        try {
            while ((viewMoreButton = await page.$('button:contains("View more")'))) {
                await viewMoreButton.click();
                await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for the invoices to load
            }
        } catch (e) {
            console.log('All invoices loaded or no more "View more" button available.');
        }

        // Download all invoices
        const invoices = await page.$$('a[href*="invoice"]');
        console.log(`Found ${invoices.length} invoice links.`);

        for (const [index, invoice] of invoices.entries()) {
            try {
                const href = await (await invoice.getProperty('href')).jsonValue();
                console.log(`Invoice ${index + 1}: Found link - ${href}`);

                const fileName = href.split('/').pop().split('?')[0]; // Remove query params
                console.log(`Invoice ${index + 1}: Extracted file name - ${fileName}`);

                const viewSource = await page.goto(href, { waitUntil: 'networkidle2' });
                console.log(`Invoice ${index + 1}: Downloading...`);

                if (!viewSource || viewSource.status() !== 200) {
                    console.error(`Invoice ${index + 1}: Failed to fetch the invoice.`);
                    continue;
                }

                const filePath = path.join(invoicesDir, fileName);
                fs.writeFileSync(filePath, await viewSource.buffer());
                console.log(`Invoice ${index + 1}: Saved to ${filePath}`);
            } catch (downloadError) {
                console.error(`Invoice ${index + 1}: Error downloading -`, downloadError);
            }
        }

        console.log('Invoices downloaded successfully.');
    } catch (e) {
        console.error('An error occurred:', e);
    } finally {
        await browser.close();
    }
})();
