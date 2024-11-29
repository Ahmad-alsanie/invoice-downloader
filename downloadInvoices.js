const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

// Use the stealth plugin to make Puppeteer less detectable
puppeteer.use(StealthPlugin());

(async () => {
    // Launch Puppeteer with headless mode off and additional configurations
    const browser = await puppeteer.launch({
        headless: false,  // Set to false to see the browser
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Specify Chrome executable path
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',  // Disable features to reduce bot detection
            '--window-size=1200,800'
        ]
    });

    const page = await browser.newPage();

    // Set a typical User-Agent string to appear as a regular browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

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
        await page.goto('https://platform.openai.com/login', { waitUntil: 'networkidle2' });

        // Human-like pause to simulate thinking time
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Move the mouse around to make it look more human-like
        await page.mouse.move(100, 100, { steps: 10 });
        await page.mouse.move(300, 200, { steps: 20 });

        // Wait for the email input to be visible and fill it with typing delays
        await page.waitForSelector('#email-input', { timeout: 60000 });
        console.log('Found email input field.');

        await page.type('#email-input', 'yourmail', { delay: 100 }); // Simulate typing with delay

        // Human-like pause before clicking the button
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Click the "Continue" button to proceed to the password step
        await page.click('.continue-btn');

        // Wait for the password field to be visible and fill it
        await page.waitForSelector('#password', { timeout: 60000 });
        console.log('Found password input field.');

        // Type password with a delay
        await page.type('#password', 'yourpass', { delay: 100 });


        // Human-like pause before clicking the submit button
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Click the "Submit" button using a more robust selector
        await page.evaluate(() => {
            const buttons = document.querySelectorAll('button[type="submit"]');
            buttons.forEach(button => {
                if (button.innerText.trim() === 'Continue') {
                    button.click();
                }
            });
        });

        // Wait for navigation to complete
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        console.log('Login successful. Navigating to pricing.');

        // Navigate to the pricing page
        await page.setJavaScriptEnabled(true);
        await page.goto('https://platform.openai.com/pricing', { waitUntil: 'networkidle2' });

        // Introduce a manual pause to ensure everything is loaded
        console.log('Pausing for 10 seconds to ensure the page loads fully...');
        await new Promise(resolve => setTimeout(resolve, 10000)); // Pause for 10 seconds

        // Wait explicitly for the "Manage my subscription" link using XPath
        const manageSubscriptionSelector = "a.px-2.underline";
        await page.waitForSelector(manageSubscriptionSelector, { timeout: 60000 });

        // Click the link using XPath
        const manageSubscriptionElement = await page.$(manageSubscriptionSelector);
        if (manageSubscriptionLink) {
            console.log('Found the "Manage my subscription" link.');
            await manageSubscriptionElement.click();
            console.log('Clicked the "Manage my subscription" link.');
            await page.setJavaScriptEnabled(false);
        } else {
            throw new Error('Manage my subscription link not found');
        }

        // Scroll and click "View more" until all invoices are loaded
        let viewMoreButton;
        try {
            while ((viewMoreButton = await page.$('button:contains("View more")'))) {
                await viewMoreButton.click();
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for the invoices to load
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
            fs.writeFileSync(path.join(__dirname, 'invoices', fileName), await viewSource.buffer());
        }

        console.log('Invoices downloaded successfully.');

    } catch (e) {
        console.error('An error occurred:', e);
    } finally {
        await browser.close();
    }
})();
