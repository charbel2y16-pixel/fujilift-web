import fs from 'node:fs';
import sharp from 'sharp';
const [json, out, bg = '#EFEEEB', fg = '#00FF9A', w = '360'] = process.argv.slice(2);
const m = JSON.parse(fs.readFileSync(json, 'utf8'));
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${m.w} ${m.h}"><rect x="-20" y="-20" width="${m.w + 40}" height="${m.h + 40}" fill="${bg}"/><path fill-rule="evenodd" fill="${fg}" d="${m.d}"/></svg>`;
fs.writeFileSync(out.replace(/\.png$/, '.svg'), svg);
await sharp(Buffer.from(svg), { density: 300 }).resize({ width: Number(w) }).png().toFile(out);
console.log('wrote', out);
