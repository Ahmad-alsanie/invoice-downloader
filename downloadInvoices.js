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
        // Step 1: Navigate to the login page
        await page.goto('https://chatgpt.com', { waitUntil: 'networkidle2' });
        console.log('Navigated to ChatGPT homepage.');

        // Step 2: Click "Continue with Google"
        await page.waitForSelector('span.social-text');
        await page.evaluate(() => {
            const googleLoginButton = Array.from(document.querySelectorAll('span.social-text'))
                .find(el => el.textContent.trim() === 'Continue with Google');
            if (googleLoginButton) googleLoginButton.click();
        });
        console.log('Clicked "Continue with Google".');

        // Step 3: Enter Google Email
        await page.waitForSelector('input[type="email"]#identifierId', { timeout: 60000 });
        console.log('Google email input field found.');
        await page.type('input[type="email"]#identifierId', 'your-google-email@example.com', { delay: 100 });
        await page.click('span.VfPpkd-vQzf8d'); // Click "Next"
        console.log('Email entered and "Next" clicked.');

        // Step 4: Handle CAPTCHA (if it appears) and click "Next"
        try {
            await page.waitForSelector('label.rc-anchor-checkbox-label', { timeout: 10000 });
            console.log('CAPTCHA detected. Waiting for manual input.');
            await page.waitForTimeout(30000); // Wait for manual CAPTCHA resolution
        } catch {
            console.log('No CAPTCHA detected.');
        }

        // Step 5: Enter Password
        await page.waitForSelector('input[type="password"]', { timeout: 60000 });
        console.log('Google password input field found.');
        await page.type('input[type="password"]', 'your-google-password', { delay: 100 });
        await page.click('span.VfPpkd-vQzf8d'); // Click "Next"
        console.log('Password entered and "Next" clicked.');

        // Step 6: Wait for login completion
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        console.log('Logged in with Google successfully.');

        // Step 7: Continue to invoice downloading steps
        await page.goto('https://chatgpt.com/#pricing', { waitUntil: 'networkidle2' });
        console.log('Navigated to Pricing page.');

        const manageSubscriptionSelector = 'a.px-2.underline';
        await page.waitForSelector(manageSubscriptionSelector, { timeout: 90000 });
        await new Promise(resolve => setTimeout(resolve, 2000)); // Add delay to ensure full rendering
        console.log('Manage my subscription link found. Clicking...');
        await page.click(manageSubscriptionSelector);

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
        for (const [index, link] of invoiceLinks.entries()) {
            try {
                console.log(`Invoice ${index + 1}: Navigating to ${link}`);
                await page.goto(link, { waitUntil: 'networkidle2' });

                const downloadButtonSelector = 'div.flex-container.justify-content-center.align-items-center span.Text';
                await page.waitForSelector(downloadButtonSelector, { timeout: 60000 });
                console.log(`Invoice ${index + 1}: Found Download button.`);

                const downloadUrl = await page.evaluate((selector) => {
                    const button = document.querySelector(selector);
                    if (button) {
                        button.click();
                        return button.innerText; // Optional: Return file name if available
                    }
                }, downloadButtonSelector);

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
