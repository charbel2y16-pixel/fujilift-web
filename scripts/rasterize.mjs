import sharp from 'sharp';
const [svg, out, width = '460', bg = '#EFEEEB'] = process.argv.slice(2);
await sharp(svg, { density: 400 })
  .resize({ width: Number(width) })
  .flatten({ background: bg })
  .png().toFile(out);
console.log('wrote', out);
