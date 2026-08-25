import { chromium } from 'playwright-core';
import sharp from 'sharp';

/**
 * Reads the hero film's actual rendered ground and compares it with the
 * surfaces used elsewhere. Modal colour, not mean — the line-work would drag
 * an average well above the ground it sits on.
 *
 *   node scripts/sample-color.mjs <url>
 */
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const url = process.argv[2];

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(7000);

const hex = (r, g, b) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');

/** Most frequent colour in a region, bucketed to shrug off dithering. */
async function modal(buf, box) {
  const { data, info } = await sharp(buf).extract(box).raw().toBuffer({ resolveWithObject: true });
  const counts = new Map();
  for (let i = 0; i < info.width * info.height; i++) {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    const key = `${r >> 1},${g >> 1},${b >> 1}`;
    const e = counts.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    e.n++; e.r += r; e.g += g; e.b += b;
    counts.set(key, e);
  }
  const [, top] = [...counts.entries()].sort((a, b) => b[1].n - a[1].n)[0];
  const r = Math.round(top.r / top.n), g = Math.round(top.g / top.n), b = Math.round(top.b / top.n);
  return { r, g, b, hex: hex(r, g, b), share: ((top.n / (info.width * info.height)) * 100).toFixed(1) };
}

// Hero at rest, in the band clear of both scrims.
const heroShot = await page.screenshot();
const heroGround = await modal(heroShot, { left: 0, top: 500, width: 1440, height: 130 });
console.log(`hero film ground   ${heroGround.hex}  rgb(${heroGround.r},${heroGround.g},${heroGround.b})  ${heroGround.share}% of the band`);

// A section card and the ground between cards, further down the page.
const marks = await page.evaluate(() => {
  const about = document.querySelector('#about .card');
  const r = about.getBoundingClientRect();
  window.scrollTo({ top: window.scrollY + r.top - 200, behavior: 'instant' });
  return true;
});
if (marks) {
  await page.waitForTimeout(1200);
  const shot = await page.screenshot();
  const card = await modal(shot, { left: 300, top: 500, width: 500, height: 120 });
  const gap = await modal(shot, { left: 0, top: 60, width: 1440, height: 60 });
  console.log(`section card       ${card.hex}  rgb(${card.r},${card.g},${card.b})`);
  console.log(`ground / gap       ${gap.hex}  rgb(${gap.r},${gap.g},${gap.b})`);
}

await browser.close();
