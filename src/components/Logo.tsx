import { useId } from 'react';
import {
  MARK_W,
  MARK_H,
  MARK_CAPSULE,
  MARK_KNOCKOUT,
  WORDMARK_W,
  WORDMARK_H,
  WORDMARK_PATH,
  MARK_OVER_WORDMARK,
  LOCKUP_GAP,
} from '@/lib/logo';

/**
 * The three locked-up versions of the identity.
 *
 *  <Logo />            full lockup — mark + wordmark (header, ~28–32px tall)
 *  <LogoMark />        mark only — favicon, app icon, loading state
 *  <LogoWordmark />    wordmark only — the oversized footer moment
 *
 * The mark is a masked capsule: the fj ligature, both wall slots and the six
 * chevrons are knocked out of it. Geometry lives in src/lib/logo.ts, generated
 * by scripts/build-logo.mjs.
 */

/**
 * `green` is the brand mint and only works on dark ground; `green-deep` is the
 * same hue for the light islands, where the mint would all but disappear.
 */
type Tone = 'navy' | 'white' | 'green' | 'green-deep';

const INK: Record<Tone, string> = {
  navy: 'var(--color-navy)',
  white: '#ffffff',
  green: 'var(--color-green)',
  'green-deep': 'var(--color-green-deep)',
};

function Mark({ fill }: { fill: string }) {
  const id = useId();
  return (
    <>
      <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width={MARK_W} height={MARK_H}>
        <path d={MARK_CAPSULE} fill="#fff" />
        {MARK_KNOCKOUT.map((d, i) => (
          <path key={i} d={d} fill="#000" />
        ))}
      </mask>
      <path d={MARK_CAPSULE} fill={fill} mask={`url(#${id})`} />
    </>
  );
}

export function LogoMark({
  size = 32,
  tone = 'green',
  className,
}: {
  size?: number;
  tone?: Tone;
  className?: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${MARK_W} ${MARK_H}`}
      width={size * (MARK_W / MARK_H)}
      height={size}
      fill="none"
      role="img"
      aria-label="Fujilift"
      className={className}
    >
      <Mark fill={INK[tone]} />
    </svg>
  );
}

export function LogoWordmark({
  tone = 'green',
  className,
  ...rest
}: {
  tone?: Tone;
  className?: string;
} & Omit<React.SVGProps<SVGSVGElement>, 'ref'>) {
  return (
    <svg
      viewBox={`0 0 ${WORDMARK_W} ${WORDMARK_H}`}
      fill="none"
      role="img"
      aria-label="Fujilift"
      className={className}
      {...rest}
    >
      <path d={WORDMARK_PATH} fill={INK[tone]} />
    </svg>
  );
}

/**
 * Full lockup. `height` is the wordmark's ink height; the mark sits 9% taller
 * and both are centred on the same axis, matching the original construction.
 */
export default function Logo({
  height = 26,
  tone = 'navy',
  markTone = 'green',
  className,
}: {
  height?: number;
  tone?: Tone;
  markTone?: Tone;
  className?: string;
}) {
  const id = useId();
  const wh = 100;
  const mh = wh * MARK_OVER_WORDMARK;
  const mw = mh * (MARK_W / MARK_H);
  const ww = wh * (WORDMARK_W / WORDMARK_H);
  const gap = mw * LOCKUP_GAP;
  const vbW = mw + gap + ww;

  return (
    <svg
      viewBox={`0 0 ${vbW.toFixed(2)} ${mh.toFixed(2)}`}
      height={height * MARK_OVER_WORDMARK}
      fill="none"
      role="img"
      aria-label="Fujilift"
      className={className}
    >
      {/* nested <svg> so the mask stays in the mark's own 512×1065 space */}
      <svg x={0} y={0} width={mw.toFixed(2)} height={mh.toFixed(2)} viewBox={`0 0 ${MARK_W} ${MARK_H}`}>
        <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width={MARK_W} height={MARK_H}>
          <path d={MARK_CAPSULE} fill="#fff" />
          {MARK_KNOCKOUT.map((d, i) => (
            <path key={i} d={d} fill="#000" />
          ))}
        </mask>
        <path d={MARK_CAPSULE} fill={INK[markTone]} mask={`url(#${id})`} />
      </svg>
      <svg
        x={(mw + gap).toFixed(2)}
        y={((mh - wh) / 2).toFixed(2)}
        width={ww.toFixed(2)}
        height={wh}
        viewBox={`0 0 ${WORDMARK_W} ${WORDMARK_H}`}
      >
        <path d={WORDMARK_PATH} fill={INK[tone]} />
      </svg>
    </svg>
  );
}
