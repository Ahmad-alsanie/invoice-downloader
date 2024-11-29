const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');

// Use the stealth plugin to make Puppeteer less detectable
puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        devtools: false, // Disable devtools to avoid the inspect window opening
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Adjust path if needed
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1200,800'],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    try {
        // Step 1: Navigate to Upwork
        await page.goto('https://www.upwork.com/', { waitUntil: 'networkidle2' });
        console.log('Navigated to Upwork homepage.');

        // Step 2: Click "Log in" button
        const loginButtonSelector = 'a.up-n-link.nav-item.login-link.d-none.d-md-block.px-6x';
        await page.waitForSelector(loginButtonSelector, { timeout: 60000, visible: true });
        await new Promise(resolve => setTimeout(resolve, 2000)); // Add a delay to ensure any transitions are complete
        await page.click(loginButtonSelector);
        console.log('Clicked Log in button.');

        // Step 3: Fill in email
        const emailFieldSelector = '#login_username';
        await page.waitForSelector(emailFieldSelector, { timeout: 60000, visible: true });

        // Clear the email input field
        await page.click(emailFieldSelector);
        await page.keyboard.press('End');
        await page.keyboard.down('Shift');
        await page.keyboard.press('Home');
        await page.keyboard.up('Shift');
        await page.keyboard.press('Backspace');

        // Type the email with moderate delay
        await page.type(emailFieldSelector, '**yourmail', { delay: 1000 }); // Replace with your email
        console.log('Entered email.');

        // Step 4: Press "Continue" button
        const continueButtonSelector = '#login_password_continue';
        await page.waitForSelector(continueButtonSelector, { timeout: 60000, visible: true });
        await new Promise(resolve => setTimeout(resolve, 2000)); // Add a delay to ensure any transitions are complete
        await page.evaluate((selector) => document.querySelector(selector).click(), continueButtonSelector);
        console.log('Clicked Continue button.');

        // Step 5: Fill in the password
        const passwordFieldSelector = '#login_password';
        await page.waitForSelector(passwordFieldSelector, { timeout: 60000, visible: true });

        // Clear the password input field
        await page.click(passwordFieldSelector);
        await page.keyboard.press('End');
        await page.keyboard.down('Shift');
        await page.keyboard.press('Home');
        await page.keyboard.up('Shift');
        await page.keyboard.press('Backspace');

        // Type the password with moderate delay
        await page.type(passwordFieldSelector, 'yourPass', { delay: 1000 }); // Replace with your password
        console.log('Entered password.');

        // Step 6: Press "Log in" button
        const loginContinueButtonSelector = '#login_control_continue';
        await page.waitForSelector(loginContinueButtonSelector, { timeout: 60000, visible: true });
        await new Promise(resolve => setTimeout(resolve, 2000)); // Add a delay to ensure any transitions are complete
        await page.evaluate((selector) => document.querySelector(selector).click(), loginContinueButtonSelector);
        console.log('Clicked Log in button.');

        // Step 7: Press "Manage finances"
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        const manageFinanceSelector = 'span.nav-item-label';
        await page.waitForSelector(manageFinanceSelector, { timeout: 60000, visible: true });
        await page.evaluate((selector) => {
            const elements = Array.from(document.querySelectorAll(selector));
            const element = elements.find(el => el.textContent.trim() === 'Manage finances');
            if (element) element.click();
        }, manageFinanceSelector);
        console.log('Clicked Manage finances.');

        // Step 8: Press "Transactions and invoices"
        const transactionsInvoicesSelector = 'a[data-cy="menu-item-trigger"]';
        await page.waitForSelector(transactionsInvoicesSelector, { timeout: 60000, visible: true });
        await new Promise(resolve => setTimeout(resolve, 2000)); // Add a delay to ensure any transitions are complete
        await page.evaluate((selector) => document.querySelector(selector).click(), transactionsInvoicesSelector);
        console.log('Navigated to Transactions and invoices.');

        // Step 9: Press "Download invoices"
        const downloadInvoicesSelector = 'button[data-qa="download-invoices"]';
        await page.waitForSelector(downloadInvoicesSelector, { timeout: 60000, visible: true });
        await new Promise(resolve => setTimeout(resolve, 2000)); // Add a delay to ensure any transitions are complete
        await page.evaluate((selector) => document.querySelector(selector).click(), downloadInvoicesSelector);
        console.log('Clicked Download invoices.');

        // Wait for download to complete
        await new Promise(resolve => setTimeout(resolve, 10000)); // Adjust delay as necessary
        console.log('Invoices downloaded successfully.');
    } catch (e) {
        console.error('An error occurred:', e);
    } finally {
        await browser.close();
    }
})();
