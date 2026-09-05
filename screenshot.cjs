const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(3000);
  
  const content = await page.content();
  console.log("HTML:", content.substring(0, 1000));
  
  await browser.close();
})();
