import sharp from 'sharp';

/**
 * Bitmap -> clean even-odd SVG path.
 *
 * 1. threshold to a binary mask
 * 2. marching squares -> boundary loops
 * 3. corner detection -> split each loop into smooth runs
 * 4. Schneider least-squares cubic fitting per run
 *
 * The result keeps chevron points sharp while the capsule and the fj
 * ligature come out as true curves instead of traced wobble.
 */

async function mask(file, crop) {
  let img = sharp(file).ensureAlpha();
  if (crop) img = img.extract(crop);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const g = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * C;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      g[y * W + x] = data[i + 3] > 128 && lum < 205 ? 1 : 0;
    }
  }
  return { g, W, H };
}

const SEGS = {
  1: [['l', 't']], 2: [['t', 'r']], 3: [['l', 'r']], 4: [['r', 'b']],
  5: [['l', 't'], ['r', 'b']], 6: [['t', 'b']], 7: [['l', 'b']], 8: [['b', 'l']],
  9: [['t', 'b']], 10: [['t', 'r'], ['b', 'l']], 11: [['r', 'b']], 12: [['l', 'r']],
  13: [['t', 'r']], 14: [['l', 't']],
};

function contours({ g, W, H }) {
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : g[y * W + x]);
  const pt = (cx, cy, e) =>
    e === 't' ? [cx + 0.5, cy] : e === 'b' ? [cx + 0.5, cy + 1]
      : e === 'l' ? [cx, cy + 0.5] : [cx + 1, cy + 0.5];
  const key = (p) => `${p[0] * 2},${p[1] * 2}`;
  const adj = new Map();
  const add = (a, b) => {
    const k = key(a);
    if (!adj.has(k)) adj.set(k, { p: a, n: [] });
    adj.get(k).n.push(b);
  };

  for (let cy = -1; cy < H; cy++) {
    for (let cx = -1; cx < W; cx++) {
      const c = at(cx, cy) | (at(cx + 1, cy) << 1) | (at(cx + 1, cy + 1) << 2) | (at(cx, cy + 1) << 3);
      for (const [e1, e2] of SEGS[c] || []) {
        const a = pt(cx, cy, e1), b = pt(cx, cy, e2);
        add(a, b); add(b, a);
      }
    }
  }

  const loops = [], used = new Set();
  for (const [k0] of adj) {
    if (used.has(k0)) continue;
    const loop = [];
    let k = k0, cur = adj.get(k), prevK = null;
    while (cur && !used.has(k)) {
      used.add(k);
      loop.push(cur.p);
      const next = cur.n.find((p) => !used.has(key(p))) ?? cur.n.find((p) => key(p) !== prevK);
      if (!next) break;
      prevK = k; k = key(next); cur = adj.get(k);
    }
    if (loop.length > 12) loops.push(loop);
  }
  return loops;
}

/* ---------- vector helpers ---------- */
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const addv = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, s) => [a[0] * s, a[1] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const len = (a) => Math.hypot(a[0], a[1]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };

const B0 = (t) => (1 - t) ** 3;
const B1 = (t) => 3 * t * (1 - t) ** 2;
const B2 = (t) => 3 * t * t * (1 - t);
const B3 = (t) => t ** 3;

const bezier = (c, t) =>
  addv(addv(mul(c[0], B0(t)), mul(c[1], B1(t))), addv(mul(c[2], B2(t)), mul(c[3], B3(t))));

function chordParams(pts) {
  const u = [0];
  for (let i = 1; i < pts.length; i++) u.push(u[i - 1] + len(sub(pts[i], pts[i - 1])));
  const total = u[u.length - 1] || 1;
  return u.map((v) => v / total);
}

function generateBezier(pts, u, t1, t2) {
  const n = pts.length;
  const A = pts.map((_, i) => [mul(t1, B1(u[i])), mul(t2, B2(u[i]))]);
  let c00 = 0, c01 = 0, c11 = 0, x0 = 0, x1 = 0;
  const first = pts[0], last = pts[n - 1];
  for (let i = 0; i < n; i++) {
    c00 += dot(A[i][0], A[i][0]);
    c01 += dot(A[i][0], A[i][1]);
    c11 += dot(A[i][1], A[i][1]);
    const tmp = sub(pts[i], addv(
      addv(mul(first, B0(u[i])), mul(first, B1(u[i]))),
      addv(mul(last, B2(u[i])), mul(last, B3(u[i]))),
    ));
    x0 += dot(A[i][0], tmp);
    x1 += dot(A[i][1], tmp);
  }
  const det = c00 * c11 - c01 * c01;
  let a1 = det === 0 ? 0 : (x0 * c11 - x1 * c01) / det;
  let a2 = det === 0 ? 0 : (c00 * x1 - c01 * x0) / det;
  const segLen = len(sub(last, first));
  if (a1 < 1e-6 || a2 < 1e-6) { a1 = a2 = segLen / 3; }
  return [first, addv(first, mul(t1, a1)), addv(last, mul(t2, a2)), last];
}

function maxError(pts, curve, u) {
  let max = 0, idx = Math.floor(pts.length / 2);
  for (let i = 1; i < pts.length - 1; i++) {
    const d = len(sub(bezier(curve, u[i]), pts[i]));
    if (d > max) { max = d; idx = i; }
  }
  return [max, idx];
}

function reparameterize(pts, u, curve) {
  return u.map((ui, i) => {
    const d = sub(bezier(curve, ui), pts[i]);
    const d1 = [
      3 * (1 - ui) ** 2 * (curve[1][0] - curve[0][0]) + 6 * (1 - ui) * ui * (curve[2][0] - curve[1][0]) + 3 * ui ** 2 * (curve[3][0] - curve[2][0]),
      3 * (1 - ui) ** 2 * (curve[1][1] - curve[0][1]) + 6 * (1 - ui) * ui * (curve[2][1] - curve[1][1]) + 3 * ui ** 2 * (curve[3][1] - curve[2][1]),
    ];
    const d2 = [
      6 * (1 - ui) * (curve[2][0] - 2 * curve[1][0] + curve[0][0]) + 6 * ui * (curve[3][0] - 2 * curve[2][0] + curve[1][0]),
      6 * (1 - ui) * (curve[2][1] - 2 * curve[1][1] + curve[0][1]) + 6 * ui * (curve[3][1] - 2 * curve[2][1] + curve[1][1]),
    ];
    const den = dot(d1, d1) + dot(d, d2);
    return den === 0 ? ui : ui - dot(d, d1) / den;
  });
}

function fitCubic(pts, t1, t2, error, out) {
  if (pts.length === 2) {
    const d = len(sub(pts[1], pts[0])) / 3;
    out.push([pts[0], addv(pts[0], mul(t1, d)), addv(pts[1], mul(t2, d)), pts[1]]);
    return;
  }
  let u = chordParams(pts);
  let curve = generateBezier(pts, u, t1, t2);
  let [err, idx] = maxError(pts, curve, u);
  if (err < error) { out.push(curve); return; }
  if (err < error * error) {
    for (let i = 0; i < 12; i++) {
      u = reparameterize(pts, u, curve);
      curve = generateBezier(pts, u, t1, t2);
      [err, idx] = maxError(pts, curve, u);
      if (err < error) { out.push(curve); return; }
    }
  }
  const centre = norm(sub(pts[idx - 1], pts[idx + 1]));
  fitCubic(pts.slice(0, idx + 1), t1, centre, error, out);
  fitCubic(pts.slice(idx), mul(centre, -1), t2, error, out);
}

/** Indices where the outline turns sharply — chevron tips, crossbar corners. */
function corners(loop, win, degrees) {
  const n = loop.length, cos = Math.cos((degrees * Math.PI) / 180), out = [];
  for (let i = 0; i < n; i++) {
    const a = norm(sub(loop[i], loop[(i - win + n) % n]));
    const b = norm(sub(loop[(i + win) % n], loop[i]));
    if (dot(a, b) < cos) out.push(i);
  }
  // keep one index per cluster of adjacent corner hits
  const kept = [];
  for (const i of out) if (!kept.length || i - kept[kept.length - 1] > win) kept.push(i);
  if (kept.length > 1 && kept[0] + n - kept[kept.length - 1] <= win) kept.shift();
  return kept;
}

/** Corner-preserving moving average — kills marching-squares staircase wobble. */
function smoothLoop(loop, iterations, win, deg) {
  const locked = new Set(corners(loop, win, deg));
  let pts = loop;
  for (let it = 0; it < iterations; it++) {
    const n = pts.length;
    pts = pts.map((p, i) => {
      if (locked.has(i)) return p;
      const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
      return [(a[0] + 2 * p[0] + b[0]) / 4, (a[1] + 2 * p[1] + b[1]) / 4];
    });
  }
  return pts;
}

function fitLoop(loop, error, win, deg) {
  const cs = corners(loop, win, deg);
  const curves = [];
  const runs = [];
  if (cs.length < 2) {
    runs.push([...loop, loop[0]]);
  } else {
    for (let i = 0; i < cs.length; i++) {
      const s = cs[i], e = cs[(i + 1) % cs.length];
      const run = [];
      for (let j = s; ; j = (j + 1) % loop.length) {
        run.push(loop[j]);
        if (j === e) break;
      }
      if (run.length >= 2) runs.push(run);
    }
  }
  for (const run of runs) {
    const t1 = norm(sub(run[1], run[0]));
    const t2 = norm(sub(run[run.length - 2], run[run.length - 1]));
    fitCubic(run, t1, t2, error, curves);
  }
  return curves;
}

/* ---------- main ---------- */
const file = process.argv[2];
const scale = Number(process.argv[3] || 512);
const error = Number(process.argv[4] || 1.2);
const crop = process.argv[6] ? JSON.parse(process.argv[6]) : null;
const deg = Number(process.argv[5] || 32);

const m = await mask(file, crop);
const loops = contours(m);

let X0 = Infinity, Y0 = Infinity, X1 = -Infinity, Y1 = -Infinity;
for (const l of loops) for (const [x, y] of l) {
  X0 = Math.min(X0, x); Y0 = Math.min(Y0, y); X1 = Math.max(X1, x); Y1 = Math.max(Y1, y);
}
const k = scale / (X1 - X0);
const r = (v) => Math.round(v * 100) / 100;
const px = (p) => `${r((p[0] - X0) * k)} ${r((p[1] - Y0) * k)}`;

const smooth = Number(process.argv[7] || 12);

let d = '', nCurves = 0;
for (const raw of loops) {
  const loop = smoothLoop(raw, smooth, 3, deg);
  const curves = fitLoop(loop, error, 3, deg);
  if (!curves.length) continue;
  nCurves += curves.length;
  d += `M${px(curves[0][0])}`;
  for (const c of curves) d += `C${px(c[1])} ${px(c[2])} ${px(c[3])}`;
  d += 'Z';
}

const w = scale, h = r((Y1 - Y0) * k);
console.error(`loops=${loops.length} curves=${nCurves} viewBox="0 0 ${w} ${h}" bytes=${d.length}`);
process.stdout.write(JSON.stringify({ w, h, d }));
