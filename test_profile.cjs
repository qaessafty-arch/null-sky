const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  
  await page.evaluate(() => {
    // Open profile
    const btns = Array.from(document.querySelectorAll('button'));
    const profileBtn = btns.find(b => b.textContent.includes('sky') || b.textContent.includes('Profile'));
    if (profileBtn) profileBtn.click();
  });
  await page.waitForTimeout(2000);
  
  await browser.close();
})();
