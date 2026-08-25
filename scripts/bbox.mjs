import sharp from 'sharp';
const [file, ...regions] = process.argv.slice(2);
const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;
const ink = (x, y) => { const i = (y * W + x) * C;
  return data[i+3] > 128 && (0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2]) < 205; };
for (const r of regions) {
  const [name, xa, xb] = r.split(':');
  let x0=W,x1=-1,y0=H,y1=-1;
  for (let y=0;y<H;y++) for (let x=Number(xa);x<=Number(xb);x++) if (ink(x,y)) {
    x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y); }
  console.log(`${name.padEnd(10)} x ${x0}..${x1} (w=${x1-x0+1})  y ${y0}..${y1} (h=${y1-y0+1})`);
}
