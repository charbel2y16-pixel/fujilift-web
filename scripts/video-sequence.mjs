import { chromium } from 'playwright-core';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Decodes the hero film into a still sequence for scroll scrubbing.
 *
 * The source has a single keyframe across all 192 frames, so every seek makes
 * the decoder replay from frame 1 — scrubbing it freezes. Stills have no seek
 * cost at all: the scrubber just swaps which one it paints.
 *
 * Frames are pulled in ascending order so the decoder can run forward instead
 * of restarting each time.
 *
 *   node scripts/video-sequence.mjs <videoUrl> <outDir> [frames] [width]
 */

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [url, outDir, countArg, widthArg] = process.argv.slice(2);
const COUNT = Number(countArg || 96);
const WIDTH = Number(widthArg || 1600);

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
await page.goto(new URL(url).origin, { waitUntil: 'domcontentloaded' });
await page.evaluate((src) => {
  const v = document.createElement('video');
  v.id = 'v';
  v.src = src;
  v.preload = 'auto';
  v.muted = true;
  document.body.appendChild(v);
}, url);
await page.waitForFunction(() => document.getElementById('v').readyState >= 3, null, { timeout: 90000 });

const duration = await page.evaluate(() => document.getElementById('v').duration);
console.log(`decoding ${COUNT} frames from ${duration.toFixed(2)}s at ${WIDTH}px wide`);

let bytes = 0;
const started = Date.now();

for (let i = 0; i < COUNT; i++) {
  const t = (duration - 0.04) * (i / (COUNT - 1));
  const dataUrl = await page.evaluate(
    (time) =>
      new Promise((res) => {
        const v = document.getElementById('v');
        const grab = () => {
          const c = document.createElement('canvas');
          c.width = v.videoWidth;
          c.height = v.videoHeight;
          c.getContext('2d').drawImage(v, 0, 0);
          res(c.toDataURL('image/jpeg', 0.95));
        };
        if (Math.abs(v.currentTime - time) < 1e-4) return grab();
        v.addEventListener('seeked', grab, { once: true });
        v.currentTime = time;
      }),
    t,
  );

  const raw = Buffer.from(dataUrl.split(',')[1], 'base64');
  const file = path.join(outDir, `f${String(i).padStart(3, '0')}.webp`);
  const info = await sharp(raw).resize({ width: WIDTH }).webp({ quality: 72, effort: 6 }).toFile(file);
  bytes += info.size;
  if (i % 12 === 0 || i === COUNT - 1) {
    process.stdout.write(`  ${i + 1}/${COUNT}  ${(bytes / 1024 / 1024).toFixed(2)} MB\r`);
  }
}

console.log(
  `\n${COUNT} frames, ${(bytes / 1024 / 1024).toFixed(2)} MB total, ` +
  `avg ${Math.round(bytes / COUNT / 1024)} kB, in ${((Date.now() - started) / 1000).toFixed(0)}s`,
);

fs.writeFileSync(
  path.join(outDir, 'manifest.json'),
  JSON.stringify({ count: COUNT, width: WIDTH, duration }, null, 2),
);

await browser.close();
