import sharp from 'sharp';
const out = process.argv[2];
const items = process.argv.slice(3);
const Wd = 900, GAP = 14;
const bufs = [];
for (const it of items) {
  const [file, label] = it.split('::');
  const b = await sharp(file, { density: 600 })
    .resize({ width: Wd, fit: 'contain', background: '#EFEEEB' })
    .flatten({ background: '#EFEEEB' }).png().toBuffer();
  const m = await sharp(b).metadata();
  bufs.push({ b, h: m.height, label });
}
const H = bufs.reduce((a, x) => a + x.h + 26 + GAP, 0);
const comps = []; let y = 0;
for (const x of bufs) {
  comps.push({ input: Buffer.from(`<svg width="${Wd}" height="26"><rect width="${Wd}" height="26" fill="#111"/><text x="8" y="19" font-family="monospace" font-size="16" fill="#0f0">${x.label}</text></svg>`), left: 0, top: y });
  comps.push({ input: x.b, left: 0, top: y + 26 });
  y += x.h + 26 + GAP;
}
await sharp({ create: { width: Wd, height: H, channels: 3, background: '#EFEEEB' } }).composite(comps).png().toFile(out);
console.log('wrote', out);
