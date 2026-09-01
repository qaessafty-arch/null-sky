const { chromium } = require('playwright');
(async () => {
  let errors = [];
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.message);
  });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  
  try {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const menuBtn = btns.find(b => b.innerHTML.includes('lucide-menu') || b.querySelector('svg.lucide-menu'));
      if (menuBtn) menuBtn.click();
      else if (btns[0]) btns[0].click();
    });
    await page.waitForTimeout(500);
    
    // Click Leaderboard
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const lbBtn = btns.find(b => b.textContent.includes('Worldwide Leaderboard') || b.textContent.includes('Leaderboard'));
      if (lbBtn) lbBtn.click();
    });
    await page.waitForTimeout(1000);
    
    // Click profile
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const menuBtn = btns.find(b => b.innerHTML.includes('lucide-menu') || b.querySelector('svg.lucide-menu'));
      if (menuBtn) menuBtn.click();
    });
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const profileBtn = btns.find(b => b.textContent.includes('sky') || b.textContent.includes('Profile'));
      if (profileBtn) profileBtn.click();
    });
    await page.waitForTimeout(1000);
  } catch (e) {
    console.log("Playwright interaction error:", e.message);
  }
  
  if (errors.length > 0) {
    console.log("CAUGHT ERRORS:");
    console.log(errors.join("\n"));
  } else {
    console.log("No console errors caught!");
  }
  
  await browser.close();
})();
