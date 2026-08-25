import { PARTS, VIEW, CAR_PARK, cwZ, ropePaths } from '@/lib/drawing';

const ROPE_INIT = ropePaths(CAR_PARK, cwZ(CAR_PARK));

/**
 * The architectural cutaway, as markup only — one inline SVG, grouped by
 * parallax layer and by draw-on order. All motion is wired by whoever renders
 * it (see Hero.tsx), so the drawing itself stays a static, server-rendered
 * asset that is already fully drawn if JS never arrives.
 */
export default function ArchDrawing({
  className = '',
  preserveAspectRatio = 'xMidYMax meet',
}: {
  className?: string;
  preserveAspectRatio?: string;
}) {
  return (
    <svg
      data-drawing
      viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
      preserveAspectRatio={preserveAspectRatio}
      className={`block ${className}`}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {(['bg', 'mid', 'fg'] as const).map((layer) => (
        <g key={layer} data-layer={layer}>
          {PARTS.filter((p) => p.layer === layer).map((part) => (
            <g key={part.draw} data-part={part.draw}>
              {part.strokes.map((s, i) => (
                <path
                  key={i}
                  d={s.d}
                  stroke="var(--color-sky)"
                  strokeWidth={s.w}
                  strokeOpacity={s.w === 1.25 ? 0.4 : 0.28}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              {part.draw === 'machine'
                ? ROPE_INIT.map((d, i) => (
                    <path
                      key={`rope-${i}`}
                      data-rope
                      d={d}
                      stroke="var(--color-sky)"
                      strokeWidth={0.75}
                      strokeOpacity={0.28}
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))
                : null}

              {part.glaze.length ? (
                <g className="glaze">
                  {part.glaze.map((s, i) => (
                    <path
                      key={i}
                      d={s.d}
                      stroke="var(--color-sky)"
                      strokeWidth={s.w}
                      strokeOpacity={0.32}
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                </g>
              ) : null}
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}
