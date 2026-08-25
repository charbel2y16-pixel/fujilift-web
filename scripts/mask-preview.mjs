import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
const dir = 'public/media/partners', out = process.argv[2];
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png')).sort();
const CW = 300, CH = 150, COLS = 4;
const comps = [];
for (let i = 0; i < files.length; i++) {
  const m = await sharp(path.join(dir, files[i])).resize({ width: CW - 40, height: CH - 40, fit: 'inside' }).toBuffer();
  const mm = await sharp(m).metadata();
  // paint navy through the alpha, as CSS mask-image + background-color would
  const tinted = await sharp({ create: { width: mm.width, height: mm.height, channels: 4, background: '#0E3145' } })
    .composite([{ input: m, blend: 'dest-in' }]).png().toBuffer();
  comps.push({ input: tinted, left: (i % COLS) * CW + (CW - mm.width) / 2 | 0, top: Math.floor(i / COLS) * CH + (CH - mm.height) / 2 | 0 });
}
const rows = Math.ceil(files.length / COLS);
await sharp({ create: { width: COLS * CW, height: rows * CH, channels: 3, background: '#EFEEEB' } })
  .composite(comps).jpeg({ quality: 88 }).toFile(out);
console.log('wrote', out, files.join(' '));
