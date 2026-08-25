import fs from 'node:fs';
import path from 'node:path';
import opentype from 'opentype.js';

/**
 * Builds the Fujilift identity: the mark is rebuilt parametrically from
 * measurements taken off the original raster (scripts/measure.mjs,
 * scripts/scan.mjs); the wordmark is outlined from Jost, the closest
 * geometric match to the original letterforms.
 *
 * Emits public/brand/*.svg and src/lib/logo.ts. Run: node scripts/build-logo.mjs
 */

/* ------------------------------------------------------------------ mark */

const W = 512, H = 1065;

const R = 238, KAPPA = 0.616, C = R * KAPPA;      // squircle corner, fuller than a circle
const capsule = [
  `M${R} 0`,
  `L${W - R} 0`,
  `C${W - R + C} 0 ${W} ${R - C} ${W} ${R}`,
  `L${W} ${H - R}`,
  `C${W} ${H - R + C} ${W - R + C} ${H} ${W - R} ${H}`,
  `L${R} ${H}`,
  `C${R - C} ${H} 0 ${H - R + C} 0 ${H - R}`,
  `L0 ${R}`,
  `C0 ${R - C} ${R - C} 0 ${R} 0`,
  'Z',
].join('');

const BL = 157, BS = 247, BR = 354;               // bar: left, stepped left, right
const RX = (BR - BL) / 2, RY = 61;                // elliptical terminals
const CAP_T = 189, CAP_B = 878;
const STEP_IN = 254, STEP_OUT = 387;

const bar = [
  `M${BL} ${CAP_T}`,
  `A${RX} ${RY} 0 0 1 ${BR} ${CAP_T}`,
  `L${BR} ${CAP_B}`,
  `A${RX} ${RY} 0 0 1 ${BL} ${CAP_B}`,
  `L${BL} ${STEP_OUT}`,
  `L${BS} ${STEP_OUT}`,
  `L${BS} ${STEP_IN}`,
  `L${BL} ${STEP_IN}`,
  'Z',
].join('');

const slotTop = 'M340 199H560V293H340Z';          // crossbar, breaks the right wall
const slotBottom = 'M-48 792H354V869H-48Z';       // hook, breaks the left wall

const SLOPE = 1.16, ARM = 84, DY = ARM / SLOPE, T = 39;
const r2 = (v) => Math.round(v * 100) / 100;
const chev = (ax, ay, dir) => {
  const dy = DY * dir, t = T * dir;
  return [
    `M${r2(ax - ARM)} ${r2(ay + dy)}`,
    `L${ax} ${ay}`,
    `L${r2(ax + ARM)} ${r2(ay + dy)}`,
    `L${r2(ax + ARM)} ${r2(ay + dy + t)}`,
    `L${ax} ${r2(ay + t)}`,
    `L${r2(ax - ARM)} ${r2(ay + dy + t)}`,
    'Z',
  ].join('');
};

// Separate subpaths: they overlap the bar, and one even-odd path would
// punch them back out where they cross.
const knockout = [
  bar, slotTop, slotBottom,
  ...[458.5, 543.8, 629].map((y) => chev(78, y, 1)),    // up, left column
  ...[451, 536.3, 621.6].map((y) => chev(434, y, -1)),  // down, right column
];

/* -------------------------------------------------------------- wordmark */

const FONT_DIR = path.join(import.meta.dirname, 'fonts');
const readFont = (file) => {
  const b = fs.readFileSync(path.join(FONT_DIR, file));
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
};

const SIZE = 1000, TRACK = 62;   // matches the original's generous letter rhythm
const bold = readFont('Jost-700.ttf');
const light = readFont('Jost-300.ttf');

const wmPath = new opentype.Path();
let pen = 0;
for (const [font, text] of [[bold, 'fuji'], [light, 'lift']]) {
  for (const ch of text) {
    const g = font.charToGlyph(ch);
    wmPath.extend(g.getPath(pen, 0, SIZE));
    pen += (g.advanceWidth / font.unitsPerEm) * SIZE + TRACK;
  }
}
const wb = wmPath.getBoundingBox();
// shift so the ink box starts at 0,0 — baseline sits at -wb.y1
const wmD = new opentype.Path();
wmD.commands = wmPath.commands.map((c) => {
  const o = { ...c };
  for (const k of ['x', 'y', 'x1', 'y1', 'x2', 'y2']) {
    if (o[k] !== undefined) o[k] = k[0] === 'x' ? o[k] - wb.x1 : o[k] - wb.y1;
  }
  return o;
});
const WM = { w: r2(wb.x2 - wb.x1), h: r2(wb.y2 - wb.y1), d: wmD.toPathData(2) };

/* --------------------------------------------------------------- lockups */

const MARK_RATIO = W / H;                    // 0.4808 — matches the original exactly
const GAP = 0.42;                            // of mark width; the old pipe divider is dropped
const MARK_OVER_WORD = 1.091;                // mark height / wordmark ink height, as drawn originally

/** Full lockup laid out on a wordmark-height of 100. */
function lockup() {
  const wh = 100, mh = wh * MARK_OVER_WORD, mw = mh * MARK_RATIO;
  const ww = wh * (WM.w / WM.h);
  const gap = mw * GAP;
  return {
    w: r2(mw + gap + ww), h: r2(mh),
    mark: { x: 0, y: 0, w: r2(mw), h: r2(mh) },
    word: { x: r2(mw + gap), y: r2((mh - wh) / 2), w: r2(ww), h: wh },
  };
}

/* ----------------------------------------------------------------- emit */

const markSvg = (fill, id) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" fill="none" role="img" aria-label="Fujilift">
  <mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
    <path d="${capsule}" fill="#fff"/>
${knockout.map((d) => `    <path d="${d}" fill="#000"/>`).join('\n')}
  </mask>
  <path d="${capsule}" fill="${fill}" mask="url(#${id})"/>
</svg>`;

const wordmarkSvg = (fill) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WM.w} ${WM.h}" fill="none" role="img" aria-label="Fujilift">
  <path d="${WM.d}" fill="${fill}"/>
</svg>`;

const lockupSvg = (markFill, wordFill, id) => {
  const L = lockup();
  // The mark goes in a nested <svg> so the mask lives in the mark's own
  // 512x1065 space — a scale() on the masked element would shrink the mask too.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L.w} ${L.h}" fill="none" role="img" aria-label="Fujilift">
  <svg x="${L.mark.x}" y="${L.mark.y}" width="${L.mark.w}" height="${L.mark.h}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
    <mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
      <path d="${capsule}" fill="#fff"/>
${knockout.map((d) => `      <path d="${d}" fill="#000"/>`).join('\n')}
    </mask>
    <path d="${capsule}" fill="${markFill}" mask="url(#${id})"/>
  </svg>
  <svg x="${L.word.x}" y="${L.word.y}" width="${L.word.w}" height="${L.word.h}" viewBox="0 0 ${WM.w} ${WM.h}" preserveAspectRatio="xMidYMid meet">
    <path d="${WM.d}" fill="${wordFill}"/>
  </svg>
</svg>`;
};

/** Square app icon: the mark on a navy tile, for the favicon and app icon. */
const iconSvg = (bg, fg, id) => {
  const pad = 76;                       // breathing room inside the tile
  const h = 512 - pad * 2;
  const w = h * (W / H);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="116" fill="${bg}"/>
  <svg x="${((512 - w) / 2).toFixed(2)}" y="${pad}" width="${w.toFixed(2)}" height="${h}" viewBox="0 0 ${W} ${H}">
    <mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
      <path d="${capsule}" fill="#fff"/>
${knockout.map((d) => `      <path d="${d}" fill="#000"/>`).join('\n')}
    </mask>
    <path d="${capsule}" fill="${fg}" mask="url(#${id})"/>
  </svg>
</svg>`;
};

/**
 * Fujilift green, from fujilift.com. GREEN is the brand mint and only holds on
 * a dark ground; GREEN_DEEP is the same hue driven down for the light lockup,
 * where the mint reads as almost nothing against white.
 */
const NAVY = '#0E3145', GREEN = '#00FF9A', GREEN_DEEP = '#0A7B4E', WHITE = '#FFFFFF';
fs.mkdirSync('public/brand', { recursive: true });
const files = {
  'mark-green.svg': markSvg(GREEN, 'a'),
  'mark-green-deep.svg': markSvg(GREEN_DEEP, 'a2'),
  'mark-navy.svg': markSvg(NAVY, 'b'),
  'mark-white.svg': markSvg(WHITE, 'c'),
  'lockup-navy.svg': lockupSvg(GREEN_DEEP, NAVY, 'd'),   // navy word = light ground
  'lockup-white.svg': lockupSvg(GREEN, WHITE, 'e'),      // white word = dark ground
  'lockup-green.svg': lockupSvg(GREEN, GREEN, 'f'),
  'wordmark-green.svg': wordmarkSvg(GREEN),
  'wordmark-navy.svg': wordmarkSvg(NAVY),
  'app-icon.svg': iconSvg(NAVY, GREEN, 'g'),
};
// the orange cuts are no longer part of the identity
for (const stale of ['mark-orange.svg', 'lockup-orange.svg', 'wordmark-orange.svg']) {
  fs.rmSync(`public/brand/${stale}`, { force: true });
}
for (const [name, svg] of Object.entries(files)) fs.writeFileSync(`public/brand/${name}`, svg);

const ts = `// Generated by scripts/build-logo.mjs — do not edit by hand.
// Mark: rebuilt parametrically from the original raster. Wordmark: Jost 700 + 300, outlined.

export const MARK_W = ${W};
export const MARK_H = ${H};
export const MARK_RATIO = ${r2(MARK_RATIO * 10000) / 10000};

export const MARK_CAPSULE =
  '${capsule}';

export const MARK_KNOCKOUT: readonly string[] = [
${knockout.map((d) => `  '${d}',`).join('\n')}
];

export const WORDMARK_W = ${WM.w};
export const WORDMARK_H = ${WM.h};
export const WORDMARK_PATH =
  '${WM.d}';

/** Mark height as a multiple of wordmark ink height, as drawn in the original lockup. */
export const MARK_OVER_WORDMARK = ${MARK_OVER_WORD};
/** Gap between mark and wordmark, as a multiple of mark width. */
export const LOCKUP_GAP = ${GAP};
`;
fs.mkdirSync('src/lib', { recursive: true });
fs.writeFileSync('src/lib/logo.ts', ts);
fs.writeFileSync('src/app/icon.svg', iconSvg(NAVY, GREEN, 'g'));

console.log(`mark ${W}x${H} ratio ${r2(MARK_RATIO * 1000) / 1000}`);
console.log(`wordmark ${WM.w}x${WM.h} ratio ${r2((WM.w / WM.h) * 1000) / 1000}  (original 2.724)`);
console.log(`wrote ${Object.keys(files).length} SVGs + src/lib/logo.ts`);
