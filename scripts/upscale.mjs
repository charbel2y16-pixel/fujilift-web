import sharp from 'sharp';
const [src, out, factor = '4', crop] = process.argv.slice(2);
let img = sharp(src).ensureAlpha();
if (crop) img = img.extract(JSON.parse(crop));
const m = await img.metadata();
await sharp(await img.png().toBuffer())
  .resize({ width: Math.round(m.width * Number(factor)), kernel: 'lanczos3' })
  .flatten({ background: '#ffffff' })
  .png().toFile(out);
console.log('wrote', out, Math.round(m.width * Number(factor)));
