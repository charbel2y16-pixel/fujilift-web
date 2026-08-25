import { chromium } from 'playwright-core';

/**
 * Reports how the hero film maps onto scroll distance, and checks the two
 * things that have to be true for the ride to read as one move:
 *
 *   1. the film is on its last frame BEFORE the pin releases — otherwise the
 *      next section slides up over a car that is still climbing;
 *   2. the dissolve (blur up, opacity down) only starts once the film is
 *      finished, and is complete by the time the pin lets go.
 *
 *   node scripts/scrub-check.mjs <url> [--mobile]
 */
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const url = process.argv[2];
const mobile = process.argv.includes('--mobile');

const VIEWPORT = mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 };

const browser = await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({
  viewport: VIEWPORT,
  isMobile: mobile,
  hasTouch: mobile,
  deviceScaleFactor: mobile ? 3 : 1,
});
const page = await ctx.newPage();

const seqRequests = new Set();
page.on('request', (r) => {
  const u = r.url();
  if (u.includes('/media/hero/')) seqRequests.add(u.split('/media/hero/')[1].split('/')[0]);
});

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(6000);

const meta = await page.evaluate(() => ({
  frames: Number(document.querySelector('canvas')?.dataset.total ?? 0),
  pageHeight: document.body.scrollHeight,
  viewport: window.innerHeight,
}));

console.log(
  `${mobile ? 'MOBILE' : 'DESKTOP'} ${VIEWPORT.width}x${VIEWPORT.height} · ` +
  `page ${meta.pageHeight}px · ${meta.frames} frames · ` +
  `fetched [${[...seqRequests].join(', ')}]`,
);

const LAST = meta.frames - 1;
const STEP = Math.round(meta.viewport / 4);
const MAX = meta.viewport * 5;

const rows = [];
for (let y = 0; y <= MAX; y += STEP) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
  await page.waitForTimeout(900);
  const s = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const hero = document.querySelector('section[aria-label="Introduction"]');
    const band = document.querySelector('[data-hero-film]');
    const cs = getComputedStyle(band);
    const blur = /blur\(([\d.]+)px\)/.exec(cs.filter);
    return {
      frame: Number(c?.dataset.frame ?? -1),
      heroTop: Math.round(hero.getBoundingClientRect().top),
      copy: +getComputedStyle(document.querySelector('[data-hero-copy]')).opacity,
      blur: blur ? +blur[1] : 0,
      alpha: +cs.opacity,
    };
  });
  rows.push({ scroll: y, ...s });
}

const w = (v, n) => String(v).padStart(n);
console.log('\n scroll | frame | % film | hero top | pinned | copy a | blur | film a');
console.log('--------+-------+--------+----------+--------+--------+------+-------');
for (const r of rows) {
  const pinned = Math.abs(r.heroTop) <= 1;
  console.log(
    ` ${w(r.scroll, 6)} | ${w(r.frame, 5)} | ${w(((r.frame / LAST) * 100).toFixed(0) + '%', 6)} |` +
    ` ${w(r.heroTop, 8)} | ${w(pinned ? 'yes' : '-', 6)} | ${w(r.copy.toFixed(2), 6)} |` +
    ` ${w(r.blur.toFixed(1), 4)} | ${w(r.alpha.toFixed(2), 6)}`,
  );
}

/* ---- the assertions ---------------------------------------------------- */

const pinned = rows.filter((r) => Math.abs(r.heroTop) <= 1);
const pinReleases = pinned.length ? pinned[pinned.length - 1].scroll + STEP : 0;
const filmDone = rows.find((r) => r.frame >= LAST);
const dissolveStarts = rows.find((r) => r.blur > 0.5);
const dissolveDone = rows.find((r) => r.alpha <= 0.02);

const fails = [];
const ok = (cond, msg) => {
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!cond) fails.push(msg);
};

console.log('');
ok(!!filmDone, `film reaches its last frame (${LAST})`);
ok(
  filmDone && filmDone.scroll < pinReleases,
  `film finishes at ~${filmDone?.scroll}px, before the pin releases at ~${pinReleases}px` +
  (filmDone ? ` (${pinReleases - filmDone.scroll}px of runway left)` : ''),
);
ok(
  filmDone && dissolveStarts && dissolveStarts.scroll >= filmDone.scroll,
  `dissolve starts at ~${dissolveStarts?.scroll}px, at or after the film finishes`,
);
ok(
  dissolveDone && dissolveDone.scroll <= pinReleases,
  `film is fully dissolved by ~${dissolveDone?.scroll}px, at or before the pin releases`,
);
ok(
  seqRequests.has(mobile ? 'seq-sm' : 'seq') && !seqRequests.has('hero.mp4'),
  `serves the ${mobile ? 'seq-sm' : 'seq'} cut and never fetches the MP4`,
);

console.log(fails.length ? `\n${fails.length} FAILED` : '\nall checks passed');
await browser.close();
process.exit(fails.length ? 1 : 0);
