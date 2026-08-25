import sharp from 'sharp';
const { data, info } = await sharp(process.argv[2]).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, C = info.channels;
const ink = (x, y) => { const i = (y * W + x) * C;
  return data[i+3] > 128 && !(data[i] > 200 && data[i+1] > 200 && data[i+2] > 200); };
const cols = [];
for (let x = 0; x < W; x++) { let n = 0; for (let y = 0; y < H; y++) if (ink(x, y)) n++; cols.push(n); }
let run = null;
for (let x = 0; x <= W; x++) {
  const empty = x === W || cols[x] === 0;
  if (empty && run === null) run = x;
  if (!empty && run !== null) { if (x - run > 3) console.log(`gap ${run}..${x-1} (${x-run}px)`); run = null; }
}
if (run !== null && W - run > 3) console.log(`gap ${run}..${W-1} (${W-run}px)`);
console.log('height profile of ink columns: first=' + cols.findIndex(c=>c>0) + ' last=' + (W-1-[...cols].reverse().findIndex(c=>c>0)));
