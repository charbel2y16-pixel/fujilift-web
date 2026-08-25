import sharp from 'sharp';
const { data, info } = await sharp(process.argv[2]).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;
const ink = (x, y) => { const i = (y * W + x) * C;
  return data[i+3] > 128 && (0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2]) < 205; };
let X0=W,X1=-1,Y0=H,Y1=-1;
for (let y=0;y<H;y++) for (let x=0;x<W;x++) if (ink(x,y)) { X0=Math.min(X0,x);X1=Math.max(X1,x);Y0=Math.min(Y0,y);Y1=Math.max(Y1,y); }
const BW = X1-X0+1, BH = Y1-Y0+1, S = 512/BW;
const n = (v) => Math.round(v*S*10)/10;
console.log(`raw bbox ${BW}x${BH}  -> normalized 512 x ${n(BH)}   scale=${S.toFixed(4)}`);
console.log('\n--- outer profile (left edge, right edge) normalized ---');
for (let y=Y0; y<=Y1; y+=Math.round(BH/40)) {
  let l=-1,r=-1;
  for (let x=X0;x<=X1;x++) if (ink(x,y)) { if(l<0) l=x; r=x; }
  if (l>=0) console.log(`y=${String(n(y-Y0)).padStart(6)}  L=${String(n(l-X0)).padStart(6)}  R=${String(n(r-X0)).padStart(6)}  w=${n(r-l+1)}`);
}
console.log('\n--- interior white runs (holes) normalized, every ~2% ---');
for (let y=Y0; y<=Y1; y+=Math.round(BH/50)) {
  let l=-1,r=-1;
  for (let x=X0;x<=X1;x++) if (ink(x,y)) { if(l<0) l=x; r=x; }
  if (l<0) continue;
  const holes=[]; let s=null;
  for (let x=l;x<=r;x++){ const v=ink(x,y); if(!v&&s===null)s=x; if(v&&s!==null){holes.push(`${n(s-X0)}..${n(x-1-X0)}`);s=null;} }
  if (s!==null) holes.push(`${n(s-X0)}..${n(r-X0)}+`);
  console.log(`y=${String(n(y-Y0)).padStart(6)}  ${holes.join('   ')}`);
}
