import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
const out = process.argv[3];
const CELL = 300, COLS = 5, PAD = 26;

const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
const rows = Math.ceil(files.length / COLS);
const W = COLS * CELL, H = rows * (CELL + PAD);

const composites = [];
for (let i = 0; i < files.length; i++) {
  const x = (i % COLS) * CELL, y = Math.floor(i / COLS) * (CELL + PAD);
  const buf = await sharp(path.join(dir, files[i]))
    .resize(CELL - 8, CELL - 8, { fit: 'contain', background: '#222' }).png().toBuffer();
  composites.push({ input: buf, left: x + 4, top: y + PAD });
  const label = files[i].replace(/\.[^.]+$/, '').slice(0, 30);
  const svg = `<svg width="${CELL}" height="${PAD}"><rect width="${CELL}" height="${PAD}" fill="#111"/><text x="6" y="18" font-family="monospace" font-size="15" fill="#0f0">${i + 1}. ${label}</text></svg>`;
  composites.push({ input: Buffer.from(svg), left: x, top: y });
}

await sharp({ create: { width: W, height: H, channels: 3, background: '#000' } })
  .composite(composites).jpeg({ quality: 82 }).toFile(out);
console.log(`${out}  ${W}x${H}  ${files.length} images`);
files.forEach((f, i) => console.log(`${i + 1}. ${f}`));
