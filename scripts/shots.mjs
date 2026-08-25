import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Screenshot harness. Drives the local dev server through system Chrome.
 *   node scripts/shots.mjs <baseUrl> <outDir> [--mobile] [--reduced] [path...]
 */

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const args = process.argv.slice(2);
const base = args.shift();
const outDir = args.shift();
const mobile = args.includes('--mobile');
const reduced = args.includes('--reduced');
const routes = args.filter((a) => !a.startsWith('--'));
const paths = routes.length ? routes : ['/'];

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME, args: ['--force-color-profile=srgb'] });
const ctx = await browser.newContext({
  viewport: mobile ? { width: 375, height: 812 } : { width: 1440, height: 920 },
  deviceScaleFactor: mobile ? 2 : 1,
  isMobile: mobile,
  hasTouch: mobile,
  reducedMotion: reduced ? 'reduce' : 'no-preference',
});

const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(`PAGEERROR ${e.message}`));

for (const route of paths) {
  const url = base.replace(/\/$/, '') + route;
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

  // walk the page so lazy images load and scroll-triggered timelines fire
  const height = await page.evaluate(async () => {
    const step = window.innerHeight * 0.75;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 260));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 900));
    return document.body.scrollHeight;
  });

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);

  const name = (route === '/' ? 'home' : route.replace(/\//g, '-').replace(/^-/, ''))
    + (mobile ? '-mobile' : '') + (reduced ? '-reduced' : '');
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true });
  console.log(`${name}.png   height=${height}`);
}

if (errors.length) {
  console.log('\n--- console errors ---');
  for (const e of [...new Set(errors)].slice(0, 20)) console.log(' ', e);
} else {
  console.log('\nno console errors');
}

await browser.close();
