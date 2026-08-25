import opentype from 'opentype.js';
import fs from 'node:fs';

/** Render "fuji"+"lift" from a font into a single normalized SVG path. */
export async function wordmark({ dir, family, boldW, lightW, size = 1000, track = 0 }) {
  const read = (w) => {
    const b = fs.readFileSync(`${dir}/${family}-${w}.ttf`);
    return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  };
  const bold = read(boldW);
  const light = read(lightW);
  const p = new opentype.Path();
  let x = 0;
  for (const [font, text] of [[bold, 'fuji'], [light, 'lift']]) {
    for (const ch of text) {
      const g = font.charToGlyph(ch);
      const gp = g.getPath(x, 0, size);
      p.extend(gp);
      x += (g.advanceWidth / font.unitsPerEm) * size + track;
    }
  }
  const bb = p.getBoundingBox();
  return { path: p, bb, width: x };
}

const [dir, family, boldW, lightW, out, track = '0'] = process.argv.slice(2);
if (out) {
  const { path, bb } = await wordmark({ dir, family, boldW, lightW, track: Number(track) });
  const w = bb.x2 - bb.x1, h = bb.y2 - bb.y1;
  const d = path.toPathData(2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bb.x1.toFixed(2)} ${bb.y1.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}"><path d="${d}" fill="#0E3145"/></svg>`;
  fs.writeFileSync(out, svg);
  console.log(`${family} ${boldW}/${lightW}  viewBox=${bb.x1.toFixed(1)} ${bb.y1.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}  ratio=${(w / h).toFixed(3)}`);
}
