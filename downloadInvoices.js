const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

// Use the stealth plugin to make Puppeteer less detectable
puppeteer.use(StealthPlugin());

(async () => {
    // Define the directory where invoices will be saved
    const invoicesDir = path.join(__dirname, 'invoices');

    // Check if the directory exists; if not, create it
    if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
        console.log(`Created directory: ${invoicesDir}`);
    }

    // Launch Puppeteer with headless mode off and additional configurations
    const browser = await puppeteer.launch({
        headless: false, // Set to false to see the browser
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Specify Chrome executable path
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled', // Disable features to reduce bot detection
            '--window-size=1200,800',
        ],
    });

    const page = await browser.newPage();

    // Set a typical User-Agent string to appear as a regular browser
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    // Block unnecessary requests like images to speed up the script and reduce bot detection
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
            req.abort();
        } else {
            req.continue();
        }
    });

    try {
        // Navigate to the login page
        await page.goto('https://auth.openai.com/authorize', { waitUntil: 'networkidle2' });

        // Human-like pause to simulate thinking time
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Fill email
        await page.waitForSelector('#email-input', { timeout: 60000 });
        await page.type('#email-input', 'yourmail', { delay: 100 });
        await page.click('.continue-btn');

        // Fill password
        await page.waitForSelector('#password', { timeout: 60000 });
        await page.type('#password', 'yourpass', { delay: 100 });

        // Click the login button
        await page.evaluate(() => {
            const buttons = document.querySelectorAll('button[type="submit"]');
            buttons.forEach((button) => {
                if (button.innerText.trim() === 'Continue') {
                    button.click();
                }
            });
        });

        // Wait for navigation to complete
        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        // Navigate to pricing page
        await page.goto('https://chatgpt.com/#pricing', { waitUntil: 'networkidle2' });

        // Wait and click the "Manage my subscription" link
        const manageSubscriptionSelector = 'a.px-2.underline';
        await page.waitForSelector(manageSubscriptionSelector, { timeout: 90000 });
        const manageSubscriptionElement = (await page.$$(manageSubscriptionSelector))[0];
        if (manageSubscriptionElement) {
            await manageSubscriptionElement.click();
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
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
        for (const invoice of invoices) {
            const href = await (await invoice.getProperty('href')).jsonValue();
            const fileName = href.split('/').pop();
            const viewSource = await page.goto(href);
            fs.writeFileSync(path.join(invoicesDir, fileName), await viewSource.buffer());
            console.log(`Saved invoice: ${fileName}`);
        }

        console.log('Invoices downloaded successfully.');
    } catch (e) {
        console.error('An error occurred:', e);
    } finally {
        await browser.close();
    }
})();
