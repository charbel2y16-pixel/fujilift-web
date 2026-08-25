import { chromium } from 'playwright-core';

/**
 * Quantifies why the MP4 could not be scrubbed, and what the still sequence
 * costs instead. node scripts/scrub-perf.mjs <origin>
 */
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const origin = process.argv[2];

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(origin, { waitUntil: 'networkidle' });
await page.waitForTimeout(7000);

/* ---- 1. what a seek on the source MP4 actually costs ------------------- */
const seekMs = await page.evaluate(async () => {
  const v = document.createElement('video');
  v.src = '/media/hero/hero.mp4';
  v.muted = true;
  v.preload = 'auto';
  document.body.appendChild(v);
  await new Promise((r) => {
    if (v.readyState >= 3) r();
    else v.addEventListener('canplaythrough', r, { once: true });
  });

  const times = [];
  // jump around the way a scrubbing user does
  for (const t of [1.2, 4.5, 2.1, 6.8, 3.3, 7.4, 0.6, 5.9]) {
    const t0 = performance.now();
    await new Promise((r) => {
      v.addEventListener('seeked', r, { once: true });
      v.currentTime = t;
    });
    times.push(+(performance.now() - t0).toFixed(1));
  }
  v.remove();
  return times;
});

/* ---- 2. what painting a decoded still costs ---------------------------- */
const paintMs = await page.evaluate(async () => {
  const imgs = await Promise.all(
    [10, 30, 50, 70, 90, 20, 60, 80].map(
      async (i) => {
        const im = new Image();
        im.decoding = 'async';
        im.src = `/media/hero/seq/f${String(i).padStart(3, '0')}.webp`;
        await im.decode();          // same as the component: decode before painting
        return im;
      },
    ),
  );
  const c = document.createElement('canvas');
  c.width = 1440; c.height = 900;
  const ctx = c.getContext('2d');
  const times = [];
  for (const im of imgs) {
    const t0 = performance.now();
    ctx.drawImage(im, 0, 0, 1440, 900);
    times.push(+(performance.now() - t0).toFixed(2));
  }
  return times;
});

const stat = (a) => ({
  min: Math.min(...a),
  max: Math.max(...a),
  avg: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2),
});

const s = stat(seekMs), p = stat(paintMs);
console.log('MP4 seek (the old path)   ', seekMs.join(', '), 'ms');
console.log(`  -> avg ${s.avg}ms, worst ${s.max}ms  ${s.avg > 16.7 ? '\u2717 misses 60fps every frame' : ''}`);
console.log('canvas paint (the new path)', paintMs.join(', '), 'ms');
console.log(`  -> avg ${p.avg}ms, worst ${p.max}ms  ${p.max < 16.7 ? '\u2713 inside a 60fps budget' : ''}`);
console.log(`\n${(s.avg / Math.max(p.avg, 0.01)).toFixed(0)}x cheaper per update`);

await browser.close();
