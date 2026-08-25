/**
 * Certification badges, redrawn as clean monochrome SVG.
 *
 * The live site serves 171px raster stamps for EuroCert and ISO 9001; these
 * replace them with a single seal motif that scales, inherits currentColor and
 * works on navy or on paper. The standard is set in type beside the mark, not
 * baked into a bitmap.
 */

const TICKS = 24;

function Seal({ size = 34, double = false }: { size?: number; double?: boolean }) {
  const c = 24, rOuter = 21.5, rTick = 18.5, rInner = 15.5;
  const ticks = Array.from({ length: TICKS }, (_, i) => {
    const a = (i / TICKS) * Math.PI * 2 - Math.PI / 2;
    const [cos, sin] = [Math.cos(a), Math.sin(a)];
    return {
      x1: (c + cos * rTick).toFixed(2),
      y1: (c + sin * rTick).toFixed(2),
      x2: (c + cos * rOuter).toFixed(2),
      y2: (c + sin * rOuter).toFixed(2),
    };
  });

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" className="shrink-0">
      <circle cx={c} cy={c} r={rInner} stroke="currentColor" strokeWidth="1.25" opacity="0.9" />
      {double ? (
        <circle cx={c} cy={c} r={rInner - 3} stroke="currentColor" strokeWidth="0.75" opacity="0.5" />
      ) : null}
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" opacity="0.45"
        />
      ))}
      <path
        d="M18.5 24.2l3.9 3.9 7.2-7.9"
        stroke="currentColor" strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CertBadge({
  standard,
  body,
  onNavy = true,
  double = false,
}: {
  standard: string;
  body: string;
  onNavy?: boolean;
  double?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 ${onNavy ? 'text-white' : 'text-navy'}`}>
      <Seal double={double} />
      <div className="leading-tight">
        <div className="text-sm font-medium tabular">{standard}</div>
        <div
          className={`text-util uppercase tracking-[0.08em] mt-1 ${
            onNavy ? 'text-white/50' : 'text-slate'
          }`}
        >
          {body}
        </div>
      </div>
    </div>
  );
}
