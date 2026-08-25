import { chromium } from 'playwright-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [url, mode] = process.argv.slice(2);
const mobile = mode === 'mobile';
const reduced = mode === 'reduced';
const browser = await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({
  viewport: mobile ? { width: 375, height: 812 } : { width: 1440, height: 900 },
  isMobile: mobile, hasTouch: mobile,
  reducedMotion: reduced ? 'reduce' : 'no-preference',
});
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(6000);
const a = await page.evaluate(() => {
  const v = document.querySelector('video');
  return { paused: v.paused, loop: v.loop, t: +v.currentTime.toFixed(2), h: document.body.scrollHeight };
});
await page.waitForTimeout(2500);
const b = await page.evaluate(() => {
  const v = document.querySelector('video');
  return { paused: v.paused, t: +v.currentTime.toFixed(2) };
});
console.log(`${mode.padEnd(8)} paused=${a.paused} loop=${a.loop} t=${a.t} -> t=${b.t}  advanced=${b.t !== a.t}  pageHeight=${a.h}`);
await browser.close();
