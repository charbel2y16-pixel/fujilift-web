import { chromium } from 'playwright-core';
import sharp from 'sharp';

/**
 * Is a clip scrubbable?
 *
 * The hero film is not played, it is scrubbed: frame index is a pure function
 * of scroll position. That imposes a requirement ordinary footage never has —
 * the camera must travel one way, at one rate, with no cuts. A clip that looks
 * fine at 24fps can be unusable here, because scrolling down and watching the
 * shaft drop back is simply broken.
 *
 * Generative video is bad at exactly this: models are trained on cinematic
 * footage, so they reach for cuts and speed ramps by default. Hence measuring
 * rather than eyeballing — a reversal is obvious in the numbers and easy to
 * miss in a contact sheet.
 *
 * Two measurements:
 *   direction/rate — for each consecutive pair, the vertical offset that best
 *                    aligns them. Monotone travel = every shift the same sign;
 *                    constant rate = every shift the same magnitude.
 *   cuts           — a shot change spikes the frame-to-frame difference well
 *                    above the running mean.
 *
 *   node scripts/motion-check.mjs <videoUrl> [--samples 60]
 *
 * The URL must be http(s) — the frames are decoded in a real browser, which is
 * also how the site decodes them, so what is measured is what will be painted.
 */
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const url = process.argv[2];
const sIdx = process.argv.indexOf('--samples');
const N = sIdx > -1 ? Number(process.argv[sIdx + 1]) : 60;

// small greyscale frames: enough to track structure, cheap to correlate
const W = 160, H = 90, MAXSHIFT = 24;

if (!url) {
  console.error('usage: node scripts/motion-check.mjs <videoUrl> [--samples 60]');
  process.exit(2);
}

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
await page.goto(new URL(url).origin, { waitUntil: 'domcontentloaded' });
await page.evaluate((src) => {
  const v = document.createElement('video');
  v.id = 'v';
  v.src = src;
  v.preload = 'auto';
  v.muted = true;
  document.body.appendChild(v);
}, url);
await page.waitForFunction(() => document.getElementById('v')?.readyState >= 3, null, { timeout: 90000 });
const duration = await page.evaluate(() => document.getElementById('v').duration);

const frames = [];
for (let i = 0; i < N; i++) {
  const t = (duration - 0.05) * (i / (N - 1));
  const dataUrl = await page.evaluate(([time, w, h]) => new Promise((res) => {
    const v = document.getElementById('v');
    const grab = () => {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(v, 0, 0, w, h);
      res(c.toDataURL('image/png'));
    };
    if (Math.abs(v.currentTime - time) < 1e-4) return grab();
    v.addEventListener('seeked', grab, { once: true });
    v.currentTime = time;
  }), [t, W, H]);
  frames.push(await sharp(Buffer.from(dataUrl.split(',')[1], 'base64')).greyscale().raw().toBuffer());
}
await browser.close();

/** Mean absolute difference between two frames with `b` shifted down by dy. */
const sad = (a, b, dy) => {
  let s = 0, n = 0;
  for (let y = MAXSHIFT; y < H - MAXSHIFT; y++) {
    const yy = y + dy;
    if (yy < 0 || yy >= H) continue;
    for (let x = 0; x < W; x += 2) {
      s += Math.abs(a[y * W + x] - b[yy * W + x]);
      n++;
    }
  }
  return n ? s / n : Infinity;
};

const shifts = [], diffs = [];
for (let i = 1; i < frames.length; i++) {
  let best = 0, bestScore = Infinity;
  for (let dy = -MAXSHIFT; dy <= MAXSHIFT; dy++) {
    const sc = sad(frames[i - 1], frames[i], dy);
    if (sc < bestScore) { bestScore = sc; best = dy; }
  }
  shifts.push(best);
  diffs.push(sad(frames[i - 1], frames[i], 0));
}

const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const md = mean(diffs);
const cuts = diffs.map((d, i) => ({ i, d })).filter((o) => o.d > md * 2.2);
const up = shifts.filter((s) => s > 0).length;
const down = shifts.filter((s) => s < 0).length;
const still = shifts.filter((s) => s === 0).length;
const moving = shifts.filter((s) => s !== 0).map(Math.abs);
const dominant = up >= down ? up : down;
const against = Math.min(up, down);

console.log(`${duration.toFixed(2)}s · ${N} samples · ${url.split('/').pop()}\n`);
console.log('per-sample vertical shift:');
console.log('  ' + shifts.join(' '));
/**
 * How far did it actually go?
 *
 * Direction and rate alone are not enough. A clip can post a perfectly steady
 * rate, no cuts and a clean direction split while never leaving the spot — ask
 * a model to interpolate between two frames that look alike and it will find
 * the cheapest path, which is barely moving. That reads as "stable" on every
 * other measure and is still useless, because scrolling a whole screen has to
 * take you somewhere. Net travel is what catches it: a real ride up a shaft
 * covers many frame-heights, a wobble covers a fraction of one.
 */
const net = shifts.reduce((a, b) => a + b, 0);
const netHeights = Math.abs(net) / H;

console.log(`\ndirection  ${up} up · ${down} down · ${still} still`);
if (moving.length) {
  console.log(`rate       mean ${mean(moving).toFixed(1)}px · min ${Math.min(...moving)} · max ${Math.max(...moving)}`);
}
console.log(`travel     ${net > 0 ? '+' : ''}${net}px net = ${netHeights.toFixed(2)} frame-heights`);
console.log(`cuts       ${cuts.length ? cuts.map((c) => c.i).join(', ') : 'none'}`);

/* ---- verdict ----------------------------------------------------------
   Thresholds are deliberately loose. A little jitter is invisible once the
   frames are graded and scrubbed; a reversal is not. */
const fails = [];
if (netHeights < 1.5) fails.push(`goes nowhere — ${netHeights.toFixed(2)} frame-heights of net travel (min 1.5)`);
if (against > shifts.length * 0.08) fails.push(`travels against itself ${against}x (max ${Math.floor(shifts.length * 0.08)})`);
if (cuts.length > 1) fails.push(`${cuts.length} cut-like jumps (max 1)`);
if (still > shifts.length * 0.25) fails.push(`stalls ${still}x (max ${Math.floor(shifts.length * 0.25)})`);
if (moving.length && Math.max(...moving) > mean(moving) * 3) fails.push('rate swings more than 3x its mean');

console.log('');
if (fails.length) {
  console.log('NOT SCRUBBABLE');
  for (const f of fails) console.log('  - ' + f);
} else {
  console.log(`SCRUBBABLE — ${dominant}/${shifts.length} samples travel the same way at a steady rate`);
}
process.exit(fails.length ? 1 : 0);
