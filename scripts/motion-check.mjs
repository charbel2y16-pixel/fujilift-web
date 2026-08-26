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
const W = 480, H = 270, MAXSHIFT = 60;

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
    for (let x = 0; x < W; x += 4) {
      s += Math.abs(a[y * W + x] - b[yy * W + x]);
      n++;
    }
  }
  return n ? s / n : Infinity;
};

/**
 * A shaft ascent is a DOLLY, not a pan.
 *
 * Measuring vertical shift alone is the wrong instrument for it. When a camera
 * flies forward up a shaft, the image does not slide — it expands radially
 * about the vanishing point, structure sweeping outward past the lens. No
 * single dy aligns two such frames, so a translation-only detector reports
 * ~zero travel for a camera moving fast. It scored the known-good hero film at
 * 0.10 frame-heights, which is how this was caught.
 *
 * So also solve for the scale factor about centre that best aligns each pair.
 * Consistent s > 1 is a steady forward dolly; the product across the clip is
 * how far it actually flew.
 */
const CX = W / 2, CY = H / 2;
const bilinear = (f, x, y) => {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = x - x0, fy = y - y0;
  const p = (xx, yy) => f[Math.min(H - 1, Math.max(0, yy)) * W + Math.min(W - 1, Math.max(0, xx))];
  return (
    p(x0, y0) * (1 - fx) * (1 - fy) + p(x0 + 1, y0) * fx * (1 - fy) +
    p(x0, y0 + 1) * (1 - fx) * fy + p(x0 + 1, y0 + 1) * fx * fy
  );
};
/** Compare b(x,y) against a sampled at the point that scaling by s maps there. */
const sadScale = (a, b, s) => {
  let sum = 0, n = 0;
  for (let y = Math.round(H * 0.12); y < H * 0.88; y += 4) {
    for (let x = Math.round(W * 0.12); x < W * 0.88; x += 4) {
      const ax = CX + (x - CX) / s, ay = CY + (y - CY) / s;
      if (ax < 0 || ax > W - 1 || ay < 0 || ay > H - 1) continue;
      sum += Math.abs(bilinear(a, ax, ay) - b[y * W + x]);
      n++;
    }
  }
  return n ? sum / n : Infinity;
};

const shifts = [], diffs = [], scales = [];
for (let i = 1; i < frames.length; i++) {
  let best = 0, bestScore = Infinity;
  for (let dy = -MAXSHIFT; dy <= MAXSHIFT; dy++) {
    const sc = sad(frames[i - 1], frames[i], dy);
    if (sc < bestScore) { bestScore = sc; best = dy; }
  }
  shifts.push(best);
  diffs.push(sad(frames[i - 1], frames[i], 0));

  let bestS = 1, bestSScore = Infinity;
  for (let s = 0.90; s <= 1.12; s += 0.004) {
    const sc = sadScale(frames[i - 1], frames[i], s);
    if (sc < bestSScore) { bestSScore = sc; bestS = s; }
  }
  scales.push(bestS);
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

// dolly: how far it flew, as a cumulative magnification
const totalZoom = scales.reduce((a, s) => a * s, 1);
const zoomIn = scales.filter((s) => s > 1.004).length;
const zoomOut = scales.filter((s) => s < 0.996).length;
const zoomFlat = scales.length - zoomIn - zoomOut;
const zoomRate = scales.map((s) => Math.abs(Math.log(s)));

/**
 * Which motion is this clip actually made of? Compare the two travel figures
 * on a common footing — frame-heights panned versus doublings flown — and
 * judge the clip on whichever it is really doing.
 */
const panScore = netHeights;
const dollyScore = Math.abs(Math.log2(totalZoom));
const isDolly = dollyScore >= panScore;

console.log(`\npan        ${up} up · ${down} down · ${still} still` +
  (moving.length ? ` · mean ${mean(moving).toFixed(1)}px` : ''));
console.log(`           ${net > 0 ? '+' : ''}${net}px net = ${netHeights.toFixed(2)} frame-heights`);
console.log(`dolly      ${zoomIn} in · ${zoomOut} out · ${zoomFlat} flat`);
console.log(`           ${totalZoom.toFixed(2)}x cumulative = ${dollyScore.toFixed(2)} doublings flown`);
console.log(`cuts       ${cuts.length ? cuts.map((c) => c.i).join(', ') : 'none'}`);
console.log(`\nreads as   ${isDolly ? 'a DOLLY (camera flying forward)' : 'a PAN (image sliding)'}`);

/* ---- verdict ----------------------------------------------------------
   Thresholds are deliberately loose. A little jitter is invisible once the
   frames are graded and scrubbed; a reversal is not. */
const fails = [];
let summary;

if (isDolly) {
  const withFlow = Math.max(zoomIn, zoomOut);
  const againstFlow = Math.min(zoomIn, zoomOut);
  if (dollyScore < 0.8) fails.push(`goes nowhere — ${totalZoom.toFixed(2)}x flown (min ~1.75x)`);
  if (againstFlow > scales.length * 0.12) fails.push(`reverses ${againstFlow}x (max ${Math.floor(scales.length * 0.12)})`);
  if (zoomFlat > scales.length * 0.3) fails.push(`stalls ${zoomFlat}x (max ${Math.floor(scales.length * 0.3)})`);
  if (Math.max(...zoomRate) > mean(zoomRate) * 4) fails.push('rate swings more than 4x its mean');
  summary = `flies ${totalZoom.toFixed(2)}x forward, ${withFlow}/${scales.length} samples the same way`;
} else {
  if (netHeights < 1.5) fails.push(`goes nowhere — ${netHeights.toFixed(2)} frame-heights of net travel (min 1.5)`);
  if (against > shifts.length * 0.08) fails.push(`travels against itself ${against}x (max ${Math.floor(shifts.length * 0.08)})`);
  if (still > shifts.length * 0.25) fails.push(`stalls ${still}x (max ${Math.floor(shifts.length * 0.25)})`);
  if (moving.length && Math.max(...moving) > mean(moving) * 3) fails.push('rate swings more than 3x its mean');
  summary = `pans ${netHeights.toFixed(2)} frame-heights, ${dominant}/${shifts.length} samples the same way`;
}

// a shot change breaks scrubbing whichever kind of move it is
if (cuts.length > 1) fails.push(`${cuts.length} cut-like jumps (max 1)`);

if (fails.length) {
  console.log('NOT SCRUBBABLE');
  for (const f of fails) console.log('  - ' + f);
} else {
  console.log(`SCRUBBABLE — ${summary}`);
}
process.exit(fails.length ? 1 : 0);
