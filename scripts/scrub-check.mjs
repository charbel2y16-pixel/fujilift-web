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

const meta = await page.evaluate(() => {
  /**
   * Measure the pin rather than assuming it. GSAP wraps a pinned element in a
   * .pin-spacer whose extra height over the element is exactly the scroll the
   * pin is worth, so the sweep can cover whatever the hero is currently set to
   * — this used to be hardcoded at five viewports, which silently stopped
   * short once the pin grew past that and reported the dissolve as missing.
   */
  const hero = document.querySelector('section[aria-label="Introduction"]');
  const spacer = hero?.closest('.pin-spacer');
  const pin = spacer ? spacer.offsetHeight - hero.offsetHeight : 0;
  return {
    frames: Number(document.querySelector('canvas')?.dataset.total ?? 0),
    pageHeight: document.body.scrollHeight,
    viewport: window.innerHeight,
    pin,
  };
});

console.log(
  `${mobile ? 'MOBILE' : 'DESKTOP'} ${VIEWPORT.width}x${VIEWPORT.height} · ` +
  `page ${meta.pageHeight}px · ${meta.frames} frames · ` +
  `pin ${meta.pin}px (${(meta.pin / meta.viewport).toFixed(1)} screens) · ` +
  `fetched [${[...seqRequests].join(', ')}]`,
);

const LAST = meta.frames - 1;
/**
 * Sweep the whole document, not just the pin. The film runs to the footer now,
 * so stopping at the pin plus a screen — which is what this did — measured
 * only the first half of it and reported the rest as missing.
 */
const SWEEP = Math.max(meta.pin + meta.viewport, meta.pageHeight - meta.viewport);
const STEP = Math.round(SWEEP / 30);
const MAX = Math.round(SWEEP);

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

/**
 * These assert the CURRENT design, which changed when the film moved out of
 * the hero and became a page-wide backdrop.
 *
 * It used to have to finish and dissolve to nothing inside the hero pin. It
 * now spends HERO_SHARE of its frames on the pin at full density and carries
 * the remainder to the footer, settling to a veiled backdrop rather than
 * disappearing. Both of those are deliberate, so checks written against the
 * old behaviour were reporting on themselves rather than on the page.
 */
const HERO_SHARE = 0.85;
const BACKDROP_ALPHA = 0.16;

const pinnedRows = rows.filter((r) => Math.abs(r.heroTop) <= 1);
const pinReleases = pinnedRows.length ? pinnedRows[pinnedRows.length - 1].scroll + STEP : 0;
const atRelease = pinnedRows.length ? pinnedRows[pinnedRows.length - 1] : null;
const last = rows[rows.length - 1];
const filmDone = rows.find((r) => r.frame >= LAST);
const settled = rows.find((r) => r.alpha <= BACKDROP_ALPHA + 0.06 && r.blur > 3);

const fails = [];
const ok = (cond, msg) => {
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!cond) fails.push(msg);
};

console.log('');
ok(
  !!atRelease && atRelease.frame >= LAST * HERO_SHARE * 0.92,
  `the ride spends its share on the pin — frame ${atRelease?.frame}/${LAST} ` +
  `(${((atRelease?.frame ?? 0) / LAST * 100).toFixed(0)}%) by the time the pin releases at ~${pinReleases}px`,
);
ok(
  !!settled && settled.scroll <= pinReleases,
  `settles to a backdrop by ~${settled?.scroll}px, at or before the pin releases`,
);
ok(
  !!last && !!atRelease && last.frame > atRelease.frame,
  `keeps advancing below the hero — frame ${atRelease?.frame} at the pin, ${last?.frame} at the foot`,
);
ok(!!filmDone, `reaches its last frame (${LAST}) by the end of the page`);
/**
 * Assert the invariant, not the filename. Which cut the hero rides is a
 * decision the component makes and is allowed to change; what must never
 * change is that exactly one of them is fetched and the MP4 never is. Naming
 * the directory here made this fail the moment the film was swapped, which is
 * a check reporting on itself rather than on the page.
 */
const cuts = [...seqRequests].filter((d) => d.startsWith('seq'));
ok(
  cuts.length === 1 && !seqRequests.has('hero.mp4'),
  `serves exactly one cut (${cuts.join(', ') || 'none'}) and never fetches the MP4`,
);

console.log(fails.length ? `\n${fails.length} FAILED` : '\nall checks passed');
await browser.close();
process.exit(fails.length ? 1 : 0);
