import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [base, outDir, ...offsets] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(base, { waitUntil: 'networkidle' });
await page.waitForTimeout(6000);   // let the video buffer

for (const off of offsets) {
  await page.evaluate((y) => window.scrollTo({ top: Number(y), behavior: 'instant' }), off);
  await page.waitForTimeout(2000);  // let the scrub and any video seek settle
  await page.screenshot({ path: path.join(outDir, `scroll-${off}.png`) });
  console.log(`scroll-${off}.png`);
}
await browser.close();
