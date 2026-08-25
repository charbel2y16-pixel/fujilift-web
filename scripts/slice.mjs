import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
const [src, outDir, chunkArg] = process.argv.slice(2);
const CHUNK = Number(chunkArg || 1700);
fs.mkdirSync(outDir, { recursive: true });
const m = await sharp(src).metadata();
const n = Math.ceil(m.height / CHUNK);
const base = path.basename(src, '.png');
for (let i = 0; i < n; i++) {
  const top = i * CHUNK;
  const h = Math.min(CHUNK, m.height - top);
  await sharp(src).extract({ left: 0, top, width: m.width, height: h })
    .resize({ width: Math.min(m.width, 1100) })
    .jpeg({ quality: 84 }).toFile(path.join(outDir, `${base}-${String(i + 1).padStart(2, '0')}.jpg`));
}
console.log(`${m.width}x${m.height} -> ${n} slices of ${CHUNK}px`);
