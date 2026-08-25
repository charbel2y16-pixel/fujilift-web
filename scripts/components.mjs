import sharp from 'sharp';
const { data, info } = await sharp(process.argv[2]).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;
const ink = (x, y) => { const i = (y * W + x) * C;
  return data[i+3] > 128 && (0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2]) < 205; };
let X0=W,X1=-1,Y0=H,Y1=-1;
for (let y=0;y<H;y++) for (let x=0;x<W;x++) if (ink(x,y)) { X0=Math.min(X0,x);X1=Math.max(X1,x);Y0=Math.min(Y0,y);Y1=Math.max(Y1,y); }
const BW=X1-X0+1, S=512/BW, n=(v)=>Math.round(v*S*10)/10;

// label non-ink components inside the bbox
const lab = new Int32Array(W*H).fill(-1);
let id = 0; const comps = [];
for (let y=Y0;y<=Y1;y++) for (let x=X0;x<=X1;x++) {
  if (ink(x,y) || lab[y*W+x] !== -1) continue;
  const q=[[x,y]]; lab[y*W+x]=id; let cnt=0, a=W,b=-1,c=H,d=-1;
  while (q.length) { const [px,py]=q.pop(); cnt++;
    a=Math.min(a,px);b=Math.max(b,px);c=Math.min(c,py);d=Math.max(d,py);
    for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx=px+dx, ny=py+dy;
      if (nx<X0||ny<Y0||nx>X1||ny>Y1) continue;
      if (!ink(nx,ny) && lab[ny*W+nx]===-1) { lab[ny*W+nx]=id; q.push([nx,ny]); } } }
  comps.push({id,cnt,a,b,c,d}); id++;
}
comps.sort((p,q)=>q.cnt-p.cnt);
console.log('non-ink components (normalized to 512-wide):');
for (const k of comps) { if (k.cnt < 300) continue;
  console.log(`#${k.id} px=${k.cnt}  x ${n(k.a-X0)}..${n(k.b-X0)} (w=${n(k.b-k.a+1)})  y ${n(k.c-Y0)}..${n(k.d-Y0)} (h=${n(k.d-k.c+1)})`);
}
// detailed rows for a chosen component
const target = process.argv[3] ? Number(process.argv[3]) : null;
if (target !== null) {
  const k = comps.find(c=>c.id===target);
  console.log(`\n--- component #${target} row spans ---`);
  for (let y=k.c;y<=k.d;y+= Math.max(1,Math.round((k.d-k.c)/34))) {
    let l=-1,r=-1; for (let x=k.a;x<=k.b;x++) if (lab[y*W+x]===target) { if(l<0)l=x; r=x; }
    if (l>=0) console.log(`y=${String(n(y-Y0)).padStart(7)}  x ${String(n(l-X0)).padStart(6)} .. ${String(n(r-X0)).padStart(6)}   w=${n(r-l+1)}`);
  }
}
