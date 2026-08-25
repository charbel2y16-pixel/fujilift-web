'use client';

import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '@/lib/gsap';

/**
 * The page as a hoistway.
 *
 * A fixed layer of line-work sitting behind everything: four vertical guide
 * rails aligned to the content column, floor plates at a fixed pitch, and
 * bracket fixings where the two meet. The plates translate with scroll, so
 * scrolling down reads as the building travelling past — the same direction
 * the hero's car climbs.
 *
 * It is drawn in CSS gradients rather than SVG on purpose: the whole thing is
 * one transform on three elements, so it costs nothing to move. Nothing here
 * is interactive and nothing announces itself — the rails sit at 10% of --sky.
 *
 * The section cards are transparent (`.card-surface` is a border, not a fill),
 * which is what lets this run unbroken from the hero to the footer.
 */

const PITCH = 340;        // floor-to-floor, in px

/**
 * Rails live in the margins, outside the 1240px content column, so the
 * structure frames the page instead of striping across it. Clamped so they
 * stay on screen as the viewport narrows.
 */
const RAILS = [
  { left: 'max(16px, calc(50% - 702px))' },
  { left: 'max(44px, calc(50% - 656px))' },
  { right: 'max(44px, calc(50% - 656px))' },
  { right: 'max(16px, calc(50% - 702px))' },
] as const;

export default function BuildingShaft() {
  const plates = useRef<HTMLDivElement>(null);
  const fixings = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    let raf = 0;
    const tick = () => {
      raf = 0;
      // modulo keeps it seamless — the pattern never has to be longer than one bay
      const y = window.scrollY % PITCH;
      const t = `translate3d(0, ${y.toFixed(1)}px, 0)`;
      if (plates.current) plates.current.style.transform = t;
      if (fixings.current) fixings.current.style.transform = t;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    tick();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    /* Large screens only: below lg the margins are too thin for the rails to
       sit beside the content instead of through it. */
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 hidden overflow-hidden lg:block">
      {/* floor plates, travelling with the scroll */}
      <div
        ref={plates}
        className="absolute inset-x-0 -top-[340px] h-[calc(100%+680px)] will-change-transform"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, rgba(169,198,216,0.09) 0 1px, transparent 1px var(--pitch))',
          ['--pitch' as string]: `${PITCH}px`,
          // strongest in the margins, almost gone behind the reading column
          maskImage:
            'linear-gradient(to right, #000 0, #000 22%, rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.18) 58%, #000 78%, #000 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, #000 0, #000 22%, rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.18) 58%, #000 78%, #000 100%)',
        }}
      />

      {/* bracket fixings where a rail crosses a plate */}
      <div
        ref={fixings}
        className="absolute inset-x-0 -top-[340px] h-[calc(100%+680px)] will-change-transform"
      >
        {RAILS.map((r, i) => (
          <span
            key={`fix-${i}`}
            className="absolute top-0 block h-full w-[15px]"
            style={{
              ...('left' in r ? { left: `calc(${r.left} - 7px)` } : { right: `calc(${r.right} - 7px)` }),
              backgroundImage:
                'repeating-linear-gradient(to bottom, rgba(169,198,216,0.22) 0 2px, transparent 2px var(--pitch))',
              ['--pitch' as string]: `${PITCH}px`,
            }}
          />
        ))}
      </div>

      {/* guide rails — continuous, so they do not travel */}
      {RAILS.map((r, i) => (
        <span
          key={`rail-${i}`}
          className="absolute top-0 block h-full w-px bg-sky/[0.12]"
          style={'left' in r ? { left: r.left } : { right: r.right }}
        />
      ))}
    </div>
  );
}
