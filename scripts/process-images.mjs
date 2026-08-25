import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Re-crops and grades Fujilift's own photography for the new layout.
 *
 *   assets/originals/**   full-resolution files pulled from fujilift.com
 *   public/media/**       cropped to the new grid, graded, WebP
 *
 * The grade is one look for the whole page: shadows lifted, saturation back
 * ~10%, highlights warmed so brick and concrete read against the navy.
 * Per-channel gain warms the highlights (multiplicative) while the offset
 * lifts the shadows (additive), which keeps mid-tones honest.
 */

const SRC = 'assets/originals';
const OUT = 'public/media';

const RATIOS = {
  '4:5': 4 / 5,
  '3:4': 3 / 4,
  '1:1': 1,
  '4:3': 4 / 3,
  '3:2': 3 / 2,
  '16:9': 16 / 9,
  '21:9': 21 / 9,
};

/** width of the emitted file, per ratio — next/image resizes down from here */
const WIDTHS = { '4:5': 1200, '3:4': 1200, '1:1': 1200, '4:3': 1500, '3:2': 1800, '16:9': 2000, '21:9': 2200 };

const grade = (img) =>
  img
    .modulate({ saturation: 0.9, brightness: 1.015 })
    .linear([1.035, 1.0, 0.963], [6, 8, 12]);

/**
 * [source, output, ratio, gravity?]
 * gravity defaults to sharp's attention strategy; named positions where the
 * subject is architectural and attention picks the wrong thing.
 */
const MANIFEST = [
  // --- hero / feature ---------------------------------------------------
  ['products/high-rise-2.jpg', 'hero/tower', '3:2', 'north'],
  ['projects/platine-tower-2.jpg', 'about/platine-tower', '4:5', 'centre'],
  ['projects/rabieh-villa.jpg', 'stats/backdrop', '21:9', 'centre'],

  // --- studio band ------------------------------------------------------
  ['features/factory-amada-black.jpg', 'studio/factory', '4:5', 'centre'],
  ['features/showroom-3.jpg', 'studio/showroom', '4:5', 'centre'],
  ['features/factory-technician.jpg', 'studio/technician', '4:3', 'centre'],

  // --- products (11) ----------------------------------------------------
  ['products/passenger.jpg', 'products/passenger', '4:5', 'centre'],
  ['products/hospital-bed.jpg', 'products/hospital-bed', '4:5', 'centre'],
  ['products/high-rise.jpg', 'products/high-rise', '4:5', 'centre'],
  ['products/mid-rise.jpg', 'products/mid-rise', '4:5', 'centre'],
  ['products/panoramic.jpg', 'products/panoramic', '4:5', 'centre'],
  ['products/vacuum.jpg', 'products/vacuum', '4:5', 'centre'],
  ['products/escalators.jpg', 'products/escalators', '4:5', 'centre'],
  ['products/freight.webp', 'products/freight', '4:5', 'centre'],
  ['products/home.jpg', 'products/home', '4:5', 'centre'],
  ['products/car.jpg', 'products/car', '4:5', 'centre'],
  ['products/chairlifts.jpg', 'products/chairlifts', '4:5', 'centre'],

  // wide variants for the product detail template
  ['products/passenger.jpg', 'products/passenger-wide', '16:9', 'centre'],
  ['products/panoramic-2.jpg', 'products/panoramic-wide', '16:9', 'centre'],
  ['products/escalators.jpg', 'products/escalators-wide', '16:9', 'centre'],
  ['products/freight.webp', 'products/freight-wide', '16:9', 'centre'],

  // --- projects (4, exterior + install) ---------------------------------
  ['projects/platine-tower.jpg', 'projects/platine-tower', '4:5', 'north'],
  ['projects/platine-tower-2.jpg', 'projects/platine-tower-install', '4:5', 'centre'],
  ['projects/rabieh-villa.jpg', 'projects/rabieh-villa', '4:5', 'centre'],
  ['projects/iveco.jpg', 'projects/iveco', '4:5', 'centre'],
  ['projects/iveco-2.jpg', 'projects/iveco-install', '4:5', 'centre'],
  ['projects/sodicar.jpg', 'projects/sodicar', '4:5', 'centre'],
  ['projects/sodicar-2.jpg', 'projects/sodicar-install', '4:5', 'centre'],

  // wide variants for the project detail template
  ['projects/platine-tower.jpg', 'projects/platine-tower-wide', '16:9', 'centre'],
  ['projects/rabieh-villa.jpg', 'projects/rabieh-villa-wide', '16:9', 'centre'],
  ['projects/iveco.jpg', 'projects/iveco-wide', '16:9', 'centre'],
  ['projects/sodicar.jpg', 'projects/sodicar-wide', '16:9', 'centre'],
];

const MAX_UPSCALE = 1.9;

const gravityOf = (g) => (!g || g === 'attention' ? sharp.strategy.attention : g);

async function run() {
  let n = 0;
  for (const [src, out, ratio, gravity] of MANIFEST) {
    const inPath = path.join(SRC, src);
    if (!fs.existsSync(inPath)) {
      console.warn(`  MISSING  ${src}`);
      continue;
    }
    const w = WIDTHS[ratio];
    const h = Math.round(w / RATIOS[ratio]);
    const outPath = path.join(OUT, `${out}.webp`);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });

    const meta = await sharp(inPath).metadata();
    // How much of the target these pixels can actually fill. Fujilift's
    // originals top out around 1200px, so a capped lanczos upscale (with a
    // light sharpen to pay for it) beats leaving the browser to interpolate.
    const native = Math.min(meta.width / w, meta.height / h);
    const scale = Math.min(1, native * MAX_UPSCALE);
    const tw = Math.round(w * scale);
    const th = Math.round(tw / RATIOS[ratio]);
    const upscaled = native < 1;

    let pipe = sharp(inPath).resize(tw, th, {
      fit: 'cover',
      position: gravityOf(gravity),
      kernel: 'lanczos3',
    });
    if (upscaled) pipe = pipe.sharpen({ sigma: 0.7, m1: 0.6, m2: 0.35 });

    await grade(pipe).webp({ quality: 86, effort: 5 }).toFile(outPath);

    n++;
    console.log(
      `  ${String(tw).padStart(4)}x${String(th).padEnd(5)} ${ratio.padEnd(5)} ` +
      `${upscaled ? `up ${(scale / native).toFixed(2)}x  ` : '          '}${out}.webp`,
    );
  }
  console.log(`\n${n} images written to ${OUT}`);
}

/**
 * Partner logos become alpha silhouettes so CSS can paint them single-tone
 * navy (mask-image + background-color) at 40% opacity, full navy on hover.
 * A plain filter can't do that — these arrive as blue, red and yellow rasters
 * on white, and every one has to end up the same one colour.
 *
 * Opacity comes from ink density OR saturation, so a pale yellow mark reads
 * as strongly as a black wordmark.
 */
async function logos() {
  const dir = path.join(SRC, 'partners');
  const out = path.join(OUT, 'partners');
  fs.mkdirSync(out, { recursive: true });

  for (const f of fs.readdirSync(dir)) {
    const name = f.replace(/\.[^.]+$/, '');
    const flat = await sharp(path.join(dir, f))
      .flatten({ background: '#ffffff' })
      .trim({ threshold: 14 })
      .resize({ width: 460, height: 200, fit: 'inside', withoutEnlargement: false })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = flat;
    const px = info.width * info.height;
    // RGBA with black RGB and a computed alpha — CSS mask-image reads alpha.
    const rgba = Buffer.alloc(px * 4);
    for (let i = 0; i < px; i++) {
      const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      const ink = ((255 - lum) / 255) * 2.2;
      const chroma = (sat / 255) * 1.6;
      rgba[i * 4 + 3] = Math.round(255 * Math.min(1, Math.max(ink, chroma)));
    }

    await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
      .png({ compressionLevel: 9, palette: false })
      .toFile(path.join(out, `${name}.png`));
  }
  console.log(`partner logos -> ${out} (alpha silhouettes)`);
}

await run();
await logos();
