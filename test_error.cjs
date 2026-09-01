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
    // open sidebar
    const btns = Array.from(document.querySelectorAll('button'));
    const menuBtn = btns.find(b => b.innerHTML.includes('lucide-menu') || b.querySelector('svg.lucide-menu'));
    if (menuBtn) menuBtn.click();
    else btns[0].click();
  });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const lbBtn = btns.find(b => b.textContent.includes('Worldwide Leaderboard') || b.textContent.includes('Leaderboard'));
    if (lbBtn) lbBtn.click();
  });
  await page.waitForTimeout(2000);
  
  await browser.close();
})();
