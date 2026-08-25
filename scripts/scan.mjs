import sharp from 'sharp';
const [file, ya, yb, xa, xb, stepArg] = process.argv.slice(2);
const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;
const ink = (x, y) => { const i = (y * W + x) * C;
  return data[i+3] > 128 && (0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2]) < 205; };
let X0=W,X1=-1,Y0=H,Y1=-1;
for (let y=0;y<H;y++) for (let x=0;x<W;x++) if (ink(x,y)) { X0=Math.min(X0,x);X1=Math.max(X1,x);Y0=Math.min(Y0,y);Y1=Math.max(Y1,y); }
const S = 512/(X1-X0+1), n=(v)=>Math.round(v*S*10)/10, inv=(v)=>Math.round(v/S);
const y1r = Y0+inv(Number(ya)), y2r = Y0+inv(Number(yb));
const x1r = X0+inv(Number(xa)), x2r = Math.min(X1, X0+inv(Number(xb)));
const step = Math.max(1, inv(Number(stepArg||4)));
for (let y=y1r; y<=y2r; y+=step) {
  const runs=[]; let s=null;
  for (let x=x1r; x<=x2r; x++) { const v = !ink(x,y);
    if (v && s===null) s=x; if (!v && s!==null) { runs.push(`${n(s-X0)}..${n(x-1-X0)}`); s=null; } }
  if (s!==null) runs.push(`${n(s-X0)}..${n(x2r-X0)}>`);
  console.log(`y=${String(n(y-Y0)).padStart(7)}  ${runs.join('  ')}`);
}
