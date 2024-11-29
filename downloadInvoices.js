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
        // Step 1: Navigate to ChatGPT homepage
        await page.goto('https://chatgpt.com', { waitUntil: 'networkidle2' });
        console.log('Navigated to ChatGPT homepage.');

        // Step 2: Click the "Log in" button
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

        // Step 3: Wait for navigation to login page
        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        // Step 4: Enter email
        await page.waitForSelector('#email-input', { timeout: 60000 });
        console.log('Email input field found.');
        await page.type('#email-input', 'ahmad.alsanie@hotmail.com', { delay: 100 });
        await page.click('.continue-btn');
        console.log('Email entered and Continue clicked.');

        // Step 5: Enter password
        await page.waitForSelector('#password', { timeout: 60000 });
        console.log('Password input field found.');
        await page.type('#password', 'ChatGPT101**', { delay: 100 });

        // Step 6: Submit login form
        await page.evaluate(() => {
            const buttons = document.querySelectorAll('button[type="submit"]');
            buttons.forEach((button) => {
                if (button.innerText.trim() === 'Continue') {
                    button.click();
                }
            });
        });
        console.log('Login form submitted.');

        // Step 7: Wait for the navigation to complete
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        console.log('Logged in successfully.');

        // Step 8: Navigate to pricing page
        await page.goto('https://chatgpt.com/#pricing', { waitUntil: 'networkidle2' });
        console.log('Navigated to Pricing page.');

        // Step 9: Click "Manage my subscription" link
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

        // Step 10: Load and extract invoice links
        const invoiceLinks = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a[data-testid="hip-link"]'))
                .map(a => a.href);
        });

        console.log(`Found ${invoiceLinks.length} invoices.`);

        // Step 11: Download all invoices
        for (const [index, link] of invoiceLinks.entries()) {
            try {
                console.log(`Invoice ${index + 1}: Downloading from ${link}`);
                const viewSource = await page.goto(link, { waitUntil: 'networkidle2' });

                if (!viewSource || viewSource.status() !== 200) {
                    console.error(`Invoice ${index + 1}: Failed to fetch.`);
                    continue;
                }

                const fileName = `invoice_${index + 1}.pdf`; // Default naming convention
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
