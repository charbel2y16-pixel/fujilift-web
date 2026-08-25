import sharp from 'sharp';
const [a, b, out] = process.argv.slice(2);
const Hh = 640;
const A = await sharp(a).resize({ height: Hh, fit: 'contain', background: '#EFEEEB' }).flatten({ background: '#EFEEEB' }).toBuffer();
const B = await sharp(b, { density: 400 }).resize({ height: Hh, fit: 'contain', background: '#EFEEEB' }).flatten({ background: '#EFEEEB' }).toBuffer();
const am = await sharp(A).metadata(), bm = await sharp(B).metadata();
await sharp({ create: { width: am.width + bm.width + 30, height: Hh, channels: 3, background: '#EFEEEB' } })
  .composite([{ input: A, left: 0, top: 0 }, { input: B, left: am.width + 30, top: 0 }])
  .png().toFile(out);
console.log('wrote', out);
