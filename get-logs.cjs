const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));
  
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000); // wait for load
  
  try {
    // Try to trigger developer login or open profile modal
    const profileBtn = await page.$('button[title="User Profile"]');
    if (profileBtn) await profileBtn.click();
    await page.waitForTimeout(1000);
    
    // Attempt to log in with developer passkey
    await page.evaluate(() => {
      window.localStorage.setItem('chess_active_account', 'dev');
    });
    await page.reload();
    await page.waitForTimeout(3000);
    
    console.log('Test completed.');
  } catch (err) {
    console.log('SCRIPT_ERROR:', err.message);
  }
  
  await browser.close();
})();
