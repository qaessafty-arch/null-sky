const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(3000);
  
  const content = await page.content();
  console.log("BODY:", content.substring(content.indexOf('<body>'), content.indexOf('<body>') + 2000));
  
  await browser.close();
})();
