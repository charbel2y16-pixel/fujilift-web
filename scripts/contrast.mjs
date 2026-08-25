import { chromium } from 'playwright-core';

/**
 * WCAG contrast audit over the rendered page. The brief asks for AA on all
 * text, and translucent white on a dark ground is easy to get wrong —
 * `text-white/45` looks fine and measures under 4.5:1.
 *
 * Colours are resolved by painting them into a 1x1 canvas rather than parsing
 * the computed string: Chrome reports Tailwind's opacity modifiers as
 * `oklab()` / `color-mix()`, which a regex reads as garbage.
 *
 *   node scripts/contrast.mjs <origin> [route...]
 */
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [origin, ...routes] = process.argv.slice(2);
const paths = routes.length ? routes : ['/'];

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

let total = 0;

for (const route of paths) {
  await page.goto(origin.replace(/\/$/, '') + route, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // Walk the page before auditing. Scroll reveals start hidden and the card
  // choreography holds each section at opacity 0 until it enters, so auditing
  // from the top only ever measured the first screenful — everything below it
  // was invisible and got skipped, which reads as a pass rather than a gap.
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 220));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 500));
  });

  const audit = await page.evaluate(() => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 1;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    const resolve = (css) => {
      cx.clearRect(0, 0, 1, 1);
      cx.fillStyle = '#000';
      cx.fillStyle = css;
      cx.fillRect(0, 0, 1, 1);
      const d = cx.getImageData(0, 0, 1, 1).data;
      return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
    };

    const over = (fg, bg) => ({
      r: fg.r * fg.a + bg.r * (1 - fg.a),
      g: fg.g * fg.a + bg.g * (1 - fg.a),
      b: fg.b * fg.a + bg.b * (1 - fg.a),
    });
    const lum = ({ r, g, b }) => {
      const f = (v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const ratio = (a, b) => {
      const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
      return (x + 0.05) / (y + 0.05);
    };

    /**
     * Composites every translucent ancestor down onto the first opaque one.
     * Stopping at the first opaque ancestor is wrong for the glass header —
     * navy text on a 66%-white pill is legible, but skipping the pill scores
     * it against the dark ground and reports a false failure.
     */
    const bgOf = (el) => {
      const stack = [];
      let base = null;
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
        const c = resolve(getComputedStyle(n).backgroundColor);
        if (c.a <= 0.001) continue;
        if (c.a > 0.99) { base = c; break; }
        stack.push(c);
      }
      base ??= resolve(getComputedStyle(document.body).backgroundColor);
      // nearest layer is first in `stack`, so composite from the back forward
      for (let i = stack.length - 1; i >= 0; i--) base = { ...over(stack[i], base), a: 1 };
      return base;
    };

    const out = [];
    const seen = new Set();
    let skipped = 0;
    for (const el of document.querySelectorAll('p,span,a,dt,dd,h1,h2,h3,h4,li,button,address')) {
      const text = (el.textContent ?? '').trim();
      if (!text || el.children.length > 0) continue;         // leaf text only
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const box = el.getBoundingClientRect();
      if (!box.width || !box.height) continue;

      // an ancestor may be scroll-hidden or mid-reveal; fold that in
      let eff = 1;
      for (let n = el; n && n !== document.body; n = n.parentElement) {
        eff *= Number(getComputedStyle(n).opacity);
      }
      if (eff < 0.5) continue;

      // A gradient/image background cannot be resolved this way. Rather than
      // report a false failure (the glass header is legible — measured 5.6:1
      // from rendered pixels), skip it and count it separately.
      let painted = false;
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
        if (getComputedStyle(n).backgroundImage !== 'none') { painted = true; break; }
        if (resolve(getComputedStyle(n).backgroundColor).a > 0.99) break;
      }
      if (painted) { skipped++; continue; }

      const bg = bgOf(el);
      const cr = ratio(over(resolve(cs.color), bg), bg);
      const px = parseFloat(cs.fontSize);
      const bold = Number(cs.fontWeight) >= 700;
      const need = px >= 24 || (px >= 18.66 && bold) ? 3 : 4.5;

      if (cr + 0.05 < need) {
        const key = `${cs.color}|${Math.round(px)}|${text.slice(0, 24)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          text: text.slice(0, 44),
          px: Math.round(px),
          ratio: +cr.toFixed(2),
          need,
          cls: (el.className?.toString() ?? '').slice(0, 70),
        });
      }
    }
    return { out, skipped };
  });

  const { out: results, skipped } = audit;
  total += results.length;
  console.log(
    `\n=== ${route} — ${results.length} below AA` +
    `${skipped ? `, ${skipped} skipped (gradient background — measure by pixel)` : ''} ===`,
  );
  for (const r of results) {
    console.log(`  ${String(r.ratio).padStart(5)} (need ${r.need})  ${String(r.px).padStart(2)}px  "${r.text}"`);
    if (r.cls) console.log(`         ${r.cls}`);
  }
}

console.log(`\n${total === 0 ? 'all text passes AA' : `${total} failing`}`);
await browser.close();
