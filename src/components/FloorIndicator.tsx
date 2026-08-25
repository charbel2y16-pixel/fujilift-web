'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A lift floor indicator for the page.
 *
 * Each section is a level. The readout tracks which one you are on, the way
 * the display in a car does, and the ticks are clickable so it doubles as
 * section navigation. It stays out of the way until you have left the hero —
 * while you are still in the film you are at the ground floor and there is
 * nothing to indicate.
 *
 * Desktop only. On a phone it would be chrome competing with the content.
 */

const LEVELS = [
  { id: 'lift', label: 'How a lift works' },
  { id: 'about', label: 'About' },
  { id: 'factory', label: 'Factory' },
  { id: 'products', label: 'Products' },
  { id: 'projects', label: 'Projects' },
  { id: 'partners', label: 'Partners' },
  { id: 'record', label: 'Track record' },
  { id: 'maintenance', label: 'Maintenance' },
];

type OnAccent = { label: boolean; tick: boolean };
const NONE: OnAccent = { label: false, tick: false };

export default function FloorIndicator() {
  const [active, setActive] = useState(-1);
  const [onAccent, setOnAccent] = useState<OnAccent>(NONE);
  const nav = useRef<HTMLElement>(null);
  const frame = useRef(0);

  useEffect(() => {
    const read = () => {
      frame.current = 0;
      const mark = window.innerHeight * 0.42;   // just above centre reads earliest
      let found = -1;
      for (let i = 0; i < LEVELS.length; i++) {
        const el = document.getElementById(LEVELS[i].id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= mark && r.bottom > mark) { found = i; break; }
        if (r.top > mark) break;                 // sections are in document order
        found = i;                               // past it — keep the last one entered
      }
      setActive(found);

      /**
       * The rail is fixed and floats over whatever scrolls under it, and its
       * white ink is invisible on the brand mint. But it does not sit cleanly
       * on or off the accent card: at 1440 the label is over the card while
       * the numbers have already cleared its right edge onto the page ground,
       * and which parts overlap changes with viewport width, because the card
       * is gutter-bound when narrow and centred when wide.
       *
       * So ask the geometry rather than assume. Each part is judged by its own
       * midpoint — majority of the ink wins — and flips independently.
       */
      const card = document.querySelector('[data-accent-card]');
      const rail = nav.current;
      let flags = NONE;
      if (card && rail && found >= 0) {
        const ar = card.getBoundingClientRect();
        const nr = rail.getBoundingClientRect();
        if (ar.top < nr.bottom && ar.bottom > nr.top) {
          const midX = (el: Element) => {
            const b = el.getBoundingClientRect();
            return b.left + b.width / 2;
          };
          const within = (x: number) => x >= ar.left && x <= ar.right;
          const lab = rail.querySelectorAll('[data-rail-label]')[found];
          const tick = rail.querySelectorAll('[data-rail-tick]')[found];
          flags = {
            label: lab ? within(midX(lab)) : false,
            tick: tick ? within(midX(tick)) : false,
          };
        }
      }
      setOnAccent((prev) =>
        prev.label === flags.label && prev.tick === flags.tick ? prev : flags,
      );
    };
    const onScroll = () => {
      if (!frame.current) frame.current = requestAnimationFrame(read);
    };

    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  const showing = active >= 0;

  return (
    <nav
      ref={nav}
      aria-label="Levels"
      className={`fixed right-[max(var(--gutter),18px)] top-1/2 z-40 hidden -translate-y-1/2
                  transition-opacity duration-500 lg:block
                  ${showing ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      <ol className="flex flex-col items-end gap-3">
        {LEVELS.map((lv, i) => {
          const on = i === active;
          return (
            /* gap-5, not gap-3: it pulls the label clear of the accent card's
               right edge, so the last glyph is not left stranded on navy. */
            <li key={lv.id} className="flex items-center justify-end gap-5">
              <span
                data-rail-label
                className={`text-util uppercase tracking-[0.08em] whitespace-nowrap transition-all
                            duration-300 ${
                              on
                                ? `opacity-100 ${onAccent.label ? 'text-ground/75' : 'text-white/70'}`
                                : 'opacity-0'
                            }`}
              >
                {lv.label}
              </span>
              <a
                data-rail-tick
                href={`#${lv.id}`}
                aria-label={`Level ${String(i + 1).padStart(2, '0')} — ${lv.label}`}
                aria-current={on ? 'true' : undefined}
                className="group flex items-center gap-2 py-1"
              >
                <span
                  className={`tabular text-util transition-colors duration-300 ${
                    on
                      ? onAccent.tick ? 'text-ground' : 'text-green'
                      : onAccent.tick
                        ? 'text-ground/70 group-hover:text-ground'
                        : 'text-white/55 group-hover:text-white/80'
                  }`}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className={`block h-px transition-all duration-300 ${
                    on
                      ? `w-7 ${onAccent.tick ? 'bg-ground' : 'bg-green'}`
                      : onAccent.tick
                        ? 'w-3.5 bg-ground/40 group-hover:w-5 group-hover:bg-ground/70'
                        : 'w-3.5 bg-white/25 group-hover:w-5 group-hover:bg-white/50'
                  }`}
                />
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
