import sharp from 'sharp';
const file = process.argv[2];
const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, C = info.channels;
const ink = (x, y) => {
  const i = (y * W + x) * C;
  const [r, g, b, a] = [data[i], data[i+1], data[i+2], data[i+3]];
  return a > 128 && !(r > 200 && g > 200 && b > 200);
};
// overall bbox
let x0 = W, x1 = -1, y0 = H, y1 = -1;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (ink(x, y)) {
  if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
}
console.log(`bbox x:${x0}..${x1} (w=${x1-x0+1})  y:${y0}..${y1} (h=${y1-y0+1})`);
const runs = (y) => { const out = []; let s = null;
  for (let x = x0; x <= x1; x++) { const v = ink(x, y);
    if (v && s === null) s = x; if (!v && s !== null) { out.push(`${s-x0}-${x-1-x0}`); s = null; } }
  if (s !== null) out.push(`${s-x0}-${x1-x0}`); return out; };
const step = process.argv[3] ? Number(process.argv[3]) : 20;
for (let y = y0; y <= y1; y += step) console.log(String(y - y0).padStart(5) + ' | ' + runs(y).join('  '));
