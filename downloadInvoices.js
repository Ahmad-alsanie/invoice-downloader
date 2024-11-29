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
        // Step 1: Log in to ChatGPT website
        await page.goto('https://chatgpt.com', { waitUntil: 'networkidle2' });
        console.log('Navigated to ChatGPT homepage.');

        await page.evaluate(() => {
            const loginButton = Array.from(document.querySelectorAll('div.flex.items-center.justify-center'))
                .find((el) => el.textContent.trim() === 'Log in');
            if (loginButton) loginButton.click();
        });
        console.log('Clicked Log in button.');

        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        await page.waitForSelector('#email-input', { timeout: 60000 });
        console.log('Email input field found.');
        await page.type('#email-input', 'your email', { delay: 100 });
        await page.click('.continue-btn');
        console.log('Email entered and Continue clicked.');

        await page.waitForSelector('#password', { timeout: 60000 });
        console.log('Password input field found.');
        await page.type('#password', 'yourPass', { delay: 100 });

        await page.evaluate(() => {
            const buttons = document.querySelectorAll('button[type="submit"]');
            buttons.forEach((button) => {
                if (button.innerText.trim() === 'Continue') {
                    button.click();
                }
            });
        });
        console.log('Login form submitted.');

        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        console.log('Logged in successfully.');

        // Step 2: Navigate to pricing page
        await page.goto('https://chatgpt.com/#pricing', { waitUntil: 'networkidle2' });
        console.log('Navigated to Pricing page.');

        // Step 3: Wait and click "Manage my subscription"
        const manageSubscriptionSelector = 'a.px-2.underline';
        await page.waitForSelector(manageSubscriptionSelector, { timeout: 90000 });
        await new Promise(resolve => setTimeout(resolve, 2000)); // Add delay to ensure full rendering
        console.log('Manage my subscription link found. Clicking...');
        await page.click(manageSubscriptionSelector);

        // Step 4: Wait for invoices to load
        console.log('Waiting for subscription management page to load...');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        const invoiceLinks = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a[data-testid="hip-link"]'));
            return links.map(link => link.href);
        });

        if (invoiceLinks.length === 0) {
            console.error('No invoices found.');
            return;
        }

        console.log(`Found ${invoiceLinks.length} invoices.`);

        // Step 5: Process each invoice
        for (const [index, link] of invoiceLinks.entries()) {
            try {
                console.log(`Invoice ${index + 1}: Navigating to ${link}`);
                await page.goto(link, { waitUntil: 'networkidle2' });

                // Wait for the "Download invoice" button
                const downloadButtonSelector = 'div.flex-container.justify-content-center.align-items-center span.Text';
                await page.waitForSelector(downloadButtonSelector, { timeout: 60000 });
                console.log(`Invoice ${index + 1}: Found Download button.`);

                // Click the download button
                const downloadUrl = await page.evaluate((selector) => {
                    const button = document.querySelector(selector);
                    if (button) {
                        button.click();
                        return button.innerText; // Optional: Return file name if available
                    }
                }, downloadButtonSelector);

                // Wait a short time for the download to complete
                await new Promise(resolve => setTimeout(resolve, 5000));

                console.log(`Invoice ${index + 1}: Successfully clicked download button.`);
            } catch (error) {
                console.error(`Invoice ${index + 1}: Error processing -`, error);
            }
        }

        console.log('All invoices processed successfully.');
    } catch (e) {
        console.error('An error occurred:', e);
    } finally {
        await browser.close();
    }
})();
