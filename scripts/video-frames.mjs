import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Grabs frames out of a served video by seeking and painting to a canvas.
 * node scripts/video-frames.mjs <url> <outDir> [count]
 */
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [url, outDir, countArg] = process.argv.slice(2);
const COUNT = Number(countArg || 8);
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
// Load from the site's own origin first, so the video is same-origin and the
// canvas readback is not tainted — a crossorigin attribute would need CORS
// headers the static server does not send.
const origin = new URL(url).origin;
await page.goto(origin, { waitUntil: 'domcontentloaded' });
await page.evaluate((src) => {
  const v = document.createElement('video');
  v.id = 'v';
  v.src = src;
  v.preload = 'auto';
  v.muted = true;
  document.body.appendChild(v);
}, url);

await page.waitForFunction(() => document.getElementById('v').readyState >= 2, null, { timeout: 60000 });
const duration = await page.evaluate(() => document.getElementById('v').duration);

for (let i = 0; i < COUNT; i++) {
  const t = (duration * i) / (COUNT - 1 || 1);
  const dataUrl = await page.evaluate(
    (time) =>
      new Promise((res) => {
        const v = document.getElementById('v');
        const grab = () => {
          const c = document.createElement('canvas');
          c.width = v.videoWidth;
          c.height = v.videoHeight;
          c.getContext('2d').drawImage(v, 0, 0);
          res(c.toDataURL('image/jpeg', 0.86));
        };
        v.addEventListener('seeked', grab, { once: true });
        v.currentTime = Math.min(time, v.duration - 0.05);
      }),
    t,
  );
  const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
  const name = `f${String(i).padStart(2, '0')}-${t.toFixed(2)}s.jpg`;
  fs.writeFileSync(path.join(outDir, name), buf);
  console.log(name);
}

console.log(`duration ${duration.toFixed(2)}s`);
await browser.close();
