/**
 * The Practice section's line drawing: a three-quarter cutaway of a panoramic
 * glass elevator in an atrium, with a short escalator truss to the right.
 *
 * Everything is generated from one projection so the whole scene shares a
 * single geometry — no hand-placed coordinates that drift out of register.
 * Output is grouped twice over: by parallax layer (bg / mid / fg) and by
 * draw-on order (ground -> frame -> plates -> rails -> machine -> car -> cw
 * -> escalator -> figures).
 *
 * The projection is a shallow dimetric rather than a true 30° isometric: at 30°
 * a four-storey atrium projects taller than it is wide, and this section needs
 * a wide band. 16° keeps the three-quarter read and lets the drawing run edge
 * to edge.
 */

export type Layer = 'bg' | 'mid' | 'fg';
export type DrawGroup =
  | 'ground' | 'frame' | 'plates' | 'rails'
  | 'machine' | 'car' | 'cw' | 'escalator' | 'figures';

export type Stroke = { d: string; w: 1.25 | 0.75 };
export type Part = { layer: Layer; draw: DrawGroup; strokes: Stroke[]; glaze: Stroke[] };

/* ------------------------------------------------------------- projection */

const ANG = (12 * Math.PI) / 180;
const KX = Math.cos(ANG);
const KY = Math.sin(ANG);
const S = 42;    // horizontal unit (1 unit ≈ 1 metre)
const ZS = 30;   // vertical unit, compressed so the band stays wide

type P = readonly [number, number];

const bb = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
const track = (x: number, y: number) => {
  if (x < bb.x0) bb.x0 = x;
  if (x > bb.x1) bb.x1 = x;
  if (y < bb.y0) bb.y0 = y;
  if (y > bb.y1) bb.y1 = y;
};

const iso = (x: number, y: number, z: number): P => {
  const sx = (x - y) * KX * S;
  const sy = (x + y) * KY * S - z * ZS;
  track(sx, sy);
  return [sx, sy];
};

const n = (v: number) => Math.round(v * 10) / 10;
const M = (p: P) => `M${n(p[0])} ${n(p[1])}`;
const L = (p: P) => `L${n(p[0])} ${n(p[1])}`;
const seg = (a: P, b: P) => `${M(a)}${L(b)}`;
const path = (pts: P[], close = false) =>
  pts.map((p, i) => (i ? L(p) : M(p))).join('') + (close ? 'Z' : '');
const circle = (cx: number, cy: number, r: number) =>
  `M${n(cx - r)} ${n(cy)}A${n(r)} ${n(r)} 0 1 1 ${n(cx + r)} ${n(cy)}A${n(r)} ${n(r)} 0 1 1 ${n(cx - r)} ${n(cy)}`;

/* ------------------------------------------------------------------ scene */

const FH = 3.3;
const LEVELS = [0, FH, FH * 2, FH * 3];
const ROOF = FH * 3;

const AT = { x0: 0, x1: 20, y0: 0, y1: 3.9 };
const SH = { x0: 1.6, x1: 4.7, y0: 0.7, y1: 3.3 };

const CAR = { x0: 1.95, x1: 4.35, y0: 0.95, y1: 2.55, h: 2.35 };
const CW = { x0: 2.2, x1: 4.05, y0: 2.85, y1: 3.15, h: 1.8 };

export const CAR_Z = { min: 0.4, max: 6.55 };
export const CAR_PARK = (CAR_Z.min + CAR_Z.max) / 2;

/**
 * Counterweight rides in exact opposition: cw + car is constant, so as one
 * rises the other falls by the same amount.
 */
const CW_SUM = 7.15;
export const cwZ = (carZ: number) => CW_SUM - carZ;

const MACHINE_Z = ROOF + 1.35;

/* ------------------------------------------------------------- primitives */

/** All twelve edges of a transparent box — this is a cutaway, nothing hides. */
function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): string[] {
  const bot: P[] = [iso(x0, y0, z0), iso(x1, y0, z0), iso(x1, y1, z0), iso(x0, y1, z0)];
  const top: P[] = [iso(x0, y0, z1), iso(x1, y0, z1), iso(x1, y1, z1), iso(x0, y1, z1)];
  return [path(bot, true), path(top, true), ...bot.map((p, i) => seg(p, top[i]))];
}

const slab = (x0: number, x1: number, y0: number, y1: number, z: number) =>
  path([iso(x0, y0, z), iso(x1, y0, z), iso(x1, y1, z), iso(x0, y1, z)], true);

/* ------------------------------------------------------------------ parts */

const parts: Part[] = [];
function add(layer: Layer, draw: DrawGroup, build: (o: {
  s: (d: string, w?: 1.25 | 0.75) => void;
  g: (d: string, w?: 1.25 | 0.75) => void;
}) => void) {
  const strokes: Stroke[] = [];
  const glaze: Stroke[] = [];
  build({
    s: (d, w = 1.25) => strokes.push({ d, w }),
    g: (d, w = 0.75) => glaze.push({ d, w }),
  });
  parts.push({ layer, draw, strokes, glaze });
}

/* --- hoistway frame + atrium structure ---------------------------------- */
add('bg', 'frame', ({ s, g }) => {
  for (const d of box(SH.x0, SH.x1, SH.y0, SH.y1, 0, ROOF + 0.6)) s(d);
  for (const z of LEVELS) s(slab(SH.x0, SH.x1, SH.y0, SH.y1, z), 0.75);

  const div = 3;
  for (let i = 1; i < div; i++) {
    const tx = SH.x0 + ((SH.x1 - SH.x0) * i) / div;
    const ty = SH.y0 + ((SH.y1 - SH.y0) * i) / div;
    g(seg(iso(tx, SH.y0, 0), iso(tx, SH.y0, ROOF + 0.6)));
    g(seg(iso(tx, SH.y1, 0), iso(tx, SH.y1, ROOF + 0.6)));
    g(seg(iso(SH.x0, ty, 0), iso(SH.x0, ty, ROOF + 0.6)));
    g(seg(iso(SH.x1, ty, 0), iso(SH.x1, ty, ROOF + 0.6)));
  }

  for (let i = 1; i < 12; i++) {
    const gx = AT.x0 + ((AT.x1 - AT.x0) * i) / 12;
    g(seg(iso(gx, AT.y1, 0), iso(gx, AT.y1, ROOF)));
  }

  const cols: Array<[number, number]> = [
    [AT.x0, AT.y0], [AT.x0, AT.y1], [AT.x1, AT.y0], [AT.x1, AT.y1],
    [6.7, AT.y0], [6.7, AT.y1], [13.4, AT.y0], [13.4, AT.y1],
  ];
  for (const [cx, cy] of cols) s(seg(iso(cx, cy, 0), iso(cx, cy, ROOF)));

  s(slab(AT.x0, AT.x1, AT.y0, AT.y1, ROOF));
  for (const cx of [AT.x0, AT.x1, 6.7, 13.4]) {
    s(seg(iso(cx, AT.y0, ROOF), iso(cx, AT.y1, ROOF)), 0.75);
  }
});

/* --- floor plates + landing doors ---------------------------------------- */
add('bg', 'plates', ({ s }) => {
  const T = 0.22;
  for (const z of LEVELS.slice(1)) {
    s(slab(AT.x0, AT.x1, AT.y0, AT.y1, z));
    s(slab(AT.x0, AT.x1, AT.y0, AT.y1, z - T), 0.75);
    s(slab(SH.x0 - 0.25, SH.x1 + 0.25, SH.y0 - 0.25, SH.y1 + 0.25, z), 0.75);
    for (const [cx, cy] of [[AT.x0, AT.y0], [AT.x1, AT.y0], [AT.x1, AT.y1], [AT.x0, AT.y1]] as const) {
      s(seg(iso(cx, cy, z), iso(cx, cy, z - T)), 0.75);
    }
  }
  for (const z of LEVELS.slice(0, 3)) {
    const dx0 = SH.x0 + 0.55, dx1 = SH.x1 - 0.55, dz = 2.2;
    s(path([iso(dx0, SH.y1, z), iso(dx0, SH.y1, z + dz), iso(dx1, SH.y1, z + dz), iso(dx1, SH.y1, z)]));
    const mid = (dx0 + dx1) / 2;
    s(seg(iso(mid, SH.y1, z), iso(mid, SH.y1, z + dz)), 0.75);
    s(seg(iso(dx0 - 0.2, SH.y1, z), iso(dx1 + 0.2, SH.y1, z)), 0.75);
  }
});

/* --- guide rails, buffers ------------------------------------------------- */
add('mid', 'rails', ({ s }) => {
  const top = ROOF + 0.6;
  const cy = (CAR.y0 + CAR.y1) / 2;
  for (const rx of [SH.x0 + 0.18, SH.x1 - 0.18]) {
    s(seg(iso(rx, cy, 0), iso(rx, cy, top)));
    for (const z of LEVELS) s(seg(iso(rx, cy, z), iso(rx, cy + 0.45, z)), 0.75);
  }
  const wy = (CW.y0 + CW.y1) / 2;
  for (const cx of [CW.x0 - 0.16, CW.x1 + 0.16]) {
    s(seg(iso(cx, wy, 0), iso(cx, wy, top)), 0.75);
  }
  for (const [bx, by] of [[(CAR.x0 + CAR.x1) / 2, cy], [(CW.x0 + CW.x1) / 2, wy]] as const) {
    s(seg(iso(bx, by, 0), iso(bx, by, 0.55)));
    s(seg(iso(bx - 0.3, by, 0.55), iso(bx + 0.3, by, 0.55)), 0.75);
  }
});

/* --- machine, sheave, ropes ----------------------------------------------- */

const CAR_CX = (CAR.x0 + CAR.x1) / 2;
const CAR_CY = (CAR.y0 + CAR.y1) / 2;
const CW_CX = (CW.x0 + CW.x1) / 2;
const CW_CY = (CW.y0 + CW.y1) / 2;

/** Vertical lines project vertically here, so ropes only need a screen x. */
const ROPE_X = {
  car: [iso(CAR_CX - 0.55, CAR_CY, 0)[0], iso(CAR_CX + 0.55, CAR_CY, 0)[0]],
  cw: [iso(CW_CX - 0.55, CW_CY, 0)[0], iso(CW_CX + 0.55, CW_CY, 0)[0]],
};
// The sheave sits above the car and counterweight, so it has to be placed on
// their depth plane — using the origin plane floats it clear of the machine.
const ROPE_PLANE = (CAR_CX + CAR_CY + CW_CX + CW_CY) / 2;
const SHEAVE_Y = ROPE_PLANE * KY * S - MACHINE_Z * ZS;
const SHEAVE_CX = (ROPE_X.car[0] + ROPE_X.cw[0] + ROPE_X.car[1] + ROPE_X.cw[1]) / 4;
const SHEAVE_R = Math.abs(ROPE_X.car[0] - ROPE_X.cw[0]) / 2;

/** Redrawn every frame the car moves. */
export function ropePaths(carZ: number, counterZ: number): string[] {
  const carTop = (CAR_CX + CAR_CY) * KY * S - (carZ + CAR.h) * ZS;
  const cwTop = (CW_CX + CW_CY) * KY * S - (counterZ + CW.h) * ZS;
  return ROPE_X.car.map((xc, i) => {
    const xw = ROPE_X.cw[i];
    const r = Math.abs(xc - xw) / 2;
    const sweep = xc > xw ? 1 : 0;
    return (
      `M${n(xc)} ${n(carTop)}L${n(xc)} ${n(SHEAVE_Y)}` +
      `A${n(r)} ${n(r)} 0 0 ${sweep} ${n(xw)} ${n(SHEAVE_Y)}` +
      `L${n(xw)} ${n(cwTop)}`
    );
  });
}

add('mid', 'machine', ({ s }) => {
  for (const d of box(SH.x0 + 0.35, SH.x1 - 0.35, SH.y0 + 0.5, SH.y1 - 0.5, ROOF + 0.75, MACHINE_Z + 0.5)) s(d);
  s(circle(SHEAVE_CX, SHEAVE_Y, SHEAVE_R));
  s(circle(SHEAVE_CX, SHEAVE_Y, SHEAVE_R * 0.34), 0.75);
  track(SHEAVE_CX - SHEAVE_R, SHEAVE_Y - SHEAVE_R);
  track(SHEAVE_CX + SHEAVE_R, SHEAVE_Y + SHEAVE_R);
});

/* --- car ------------------------------------------------------------------ */
add('mid', 'car', ({ s, g }) => {
  const z1 = CAR.h;   // drawn at z=0, translated by the timeline
  for (const d of box(CAR.x0, CAR.x1, CAR.y0, CAR.y1, 0, z1)) s(d);
  s(slab(CAR.x0 + 0.12, CAR.x1 - 0.12, CAR.y0 + 0.12, CAR.y1 - 0.12, 0.06), 0.75);
  s(seg(iso(CAR.x0, CAR.y1, z1 - 0.18), iso(CAR.x1, CAR.y1, z1 - 0.18)), 0.75);
  const cmid = (CAR.x0 + CAR.x1) / 2;
  s(seg(iso(cmid, CAR.y1, 0), iso(cmid, CAR.y1, z1 - 0.18)), 0.75);
  for (const gx of [CAR.x0 + 0.5, CAR.x1 - 0.5]) {
    g(seg(iso(gx, CAR.y1, 0), iso(gx, CAR.y1, z1 - 0.18)));
  }
  s(path([iso(CAR.x0, CAR_CY, z1), iso(CAR_CX, CAR_CY, z1 + 0.42), iso(CAR.x1, CAR_CY, z1)]), 0.75);
});

/* --- counterweight -------------------------------------------------------- */
add('mid', 'cw', ({ s }) => {
  for (const d of box(CW.x0, CW.x1, CW.y0, CW.y1, 0, CW.h)) s(d);
  for (let i = 1; i < 5; i++) {
    const z = (CW.h * i) / 5;
    s(seg(iso(CW.x0, CW.y1, z), iso(CW.x1, CW.y1, z)), 0.75);
  }
});

/* --- escalator truss ------------------------------------------------------ */
add('fg', 'escalator', ({ s, g }) => {
  const E = { x0: 11.6, x1: 18.4, y0: 0.8, y1: 2.5, z0: 0, z1: FH };
  const run = E.x1 - E.x0, rise = E.z1 - E.z0, depth = 0.95;
  const at = (t: number, dz: number, y: number) => iso(E.x0 + run * t, y, E.z0 + rise * t + dz);

  for (const y of [E.y0, E.y1]) {
    s(seg(at(0, 0, y), at(1, 0, y)));
    s(seg(at(0, -depth, y), at(1, -depth, y)));
    s(seg(at(0, 0, y), at(0, -depth, y)));
    s(seg(at(1, 0, y), at(1, -depth, y)));
    const bays = 5;
    for (let i = 0; i < bays; i++) {
      const a = i / bays, b = (i + 1) / bays;
      s(seg(at(a, 0, y), at(b, -depth, y)), 0.75);
      s(seg(at(a, -depth, y), at(b, 0, y)), 0.75);
      s(seg(at(b, 0, y), at(b, -depth, y)), 0.75);
    }
  }
  for (const t of [0, 0.5, 1]) {
    s(seg(at(t, 0, E.y0), at(t, 0, E.y1)), 0.75);
    s(seg(at(t, -depth, E.y0), at(t, -depth, E.y1)), 0.75);
  }

  const steps = 11;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    s(seg(at(t, 0.02, E.y0), at(t, 0.02, E.y1)), 0.75);
  }
  g(seg(at(0, 0.02, E.y0), at(1, 0.02, E.y0)));
  g(seg(at(0, 0.02, E.y1), at(1, 0.02, E.y1)));

  for (const y of [E.y0, E.y1]) {
    s(seg(at(0, 1.05, y), at(1, 1.05, y)));
    s(seg(at(0, 0.02, y), at(0, 1.05, y)), 0.75);
    s(seg(at(1, 0.02, y), at(1, 1.05, y)), 0.75);
    for (let i = 1; i < 5; i++) {
      const t = i / 5;
      g(seg(at(t, 0.02, y), at(t, 1.05, y)));
    }
  }
  s(slab(E.x0 - 0.7, E.x0, E.y0, E.y1, E.z0), 0.75);
  s(slab(E.x1, E.x1 + 0.7, E.y0, E.y1, E.z1), 0.75);
});

/* --- figures --------------------------------------------------------------- */
add('fg', 'figures', ({ s }) => {
  const H = 1.72;
  const figure = (x: number, y: number, z: number, flip = 1) => {
    const foot = iso(x, y, z);
    const hip = iso(x, y, z + H * 0.5);
    const shoulder = iso(x, y, z + H * 0.82);
    const head = iso(x, y, z + H * 0.93);
    const hr = H * 0.082 * ZS;
    const spread = 0.16 * KX * S * flip;
    s(seg(hip, shoulder), 0.75);
    s(circle(head[0], head[1], hr), 0.75);
    track(head[0], head[1] - hr);
    s(path([[hip[0] - spread, foot[1]], hip, [hip[0] + spread * 1.4, foot[1]]]), 0.75);
    s(path([[shoulder[0] - spread * 1.1, hip[1] + 2], shoulder, [shoulder[0] + spread * 0.9, hip[1]]]), 0.75);
  };
  figure(6.6, 3.6, 0);
  figure(7.5, 3.15, 0, -1);
  figure(5.9, 1.6, FH * 2);
  figure(14.9, 1.65, FH * 0.5 + 0.5);
  figure(9.8, 3.5, 0, -1);
  figure(10.4, 1.2, FH, -1);
});

/* ---------------------------------------------------------------- assembly */

// The car and counterweight travel inside the shaft, which the frame already
// bounds — no extra vertical reserve is needed and adding one only squares the
// band off.
const PAD = 30;

export const VIEW = {
  x: Math.round(bb.x0 - PAD),
  y: Math.round(bb.y0 - PAD),
  w: Math.round(bb.x1 - bb.x0 + PAD * 2),
  h: Math.round(bb.y1 - bb.y0 + PAD * 2),
};

/* The ground datum is built last so it can span the finished viewBox. */
{
  const groundY = (AT.x1 + AT.y1) * KY * S;
  parts.unshift({
    layer: 'fg',
    draw: 'ground',
    strokes: [
      { d: `M${VIEW.x - 60} ${n(groundY)}L${VIEW.x + VIEW.w + 60} ${n(groundY)}`, w: 0.75 },
      { d: slab(AT.x0, AT.x1, AT.y0, AT.y1, 0), w: 0.75 },
    ],
    glaze: [],
  });
}

export const PARTS = parts;

/** Draw-on order. The reveal is structural, not random. */
export const DRAW_ORDER: DrawGroup[] = [
  'ground', 'frame', 'plates', 'rails', 'machine', 'car', 'cw', 'escalator', 'figures',
];

/** Screen offset that puts a car drawn at z=0 at travel height `z`. */
export const carOffset = (z: number) => -z * ZS;
