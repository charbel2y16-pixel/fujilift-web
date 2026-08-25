import sharp from 'sharp';
const [out, left, top, w, h, ...files] = process.argv.slice(2);
const bufs = [];
for (const f of files) {
  const [file, label] = f.split('::');
  const b = await sharp(file).extract({ left: +left, top: +top, width: +w, height: +h }).png().toBuffer();
  bufs.push({ b, label });
}
const GAP = 12, LH = 24;
const W = (+w) * bufs.length + GAP * (bufs.length - 1);
const comps = [];
bufs.forEach((x, i) => {
  const left0 = i * (+w + GAP);
  comps.push({ input: Buffer.from(`<svg width="${w}" height="${LH}"><rect width="${w}" height="${LH}" fill="#111"/><text x="6" y="17" font-family="monospace" font-size="14" fill="#0f0">${x.label}</text></svg>`), left: left0, top: 0 });
  comps.push({ input: x.b, left: left0, top: LH });
});
await sharp({ create: { width: W, height: +h + LH, channels: 3, background: '#000' } })
  .composite(comps).png().toFile(out);
console.log('wrote', out);
