'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Eyebrow } from './ui';
import { yearsActive } from '@/lib/data';
import { stagger, child, VIEWPORT } from '@/lib/motion';
import { gsap, useGsap, SCROLL_OK, MOTION_OK, markMoving, unmarkMoving } from '@/lib/gsap';

/**
 * Stats — a real building photograph, darkened, with a white card floating
 * over it. The photo scrubs at 0.8x so the card appears to sit above it.
 *
 * Figures render at their final value and count up only where motion is
 * allowed, so reduced-motion and no-JS both read correctly. Tabular figures
 * mean nothing reflows while the numbers run.
 */

const STATS = [
  { value: 1983, from: 1940, suffix: '', label: 'Founded in Lebanon' },
  { value: yearsActive(), from: 0, suffix: '+', label: 'Years in vertical transport' },
  { text: 'EN 81-20', label: 'EU standards, ISO 9001 certified' },
] as const;

export default function Stats() {
  const root = useRef<HTMLElement>(null);

  useGsap(({ mm }) => {
    mm.add(SCROLL_OK, () => {
      const photo = root.current?.querySelector<HTMLElement>('[data-stats-photo]');
      if (!photo) return;
      markMoving(photo);
      gsap.fromTo(photo, { y: -28 }, {
        y: 28, ease: 'none',
        scrollTrigger: {
          trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: 1,
          onLeave: () => unmarkMoving(photo), onEnterBack: () => markMoving(photo),
        },
      });
    });

    mm.add(MOTION_OK, () => {
      const nums = Array.from(root.current?.querySelectorAll<HTMLElement>('[data-count]') ?? []);
      for (const el of nums) {
        const to = Number(el.dataset.count);
        const from = Number(el.dataset.from ?? 0);
        const suffix = el.dataset.suffix ?? '';
        const proxy = { v: from };
        gsap.to(proxy, {
          v: to,
          duration: 1.2,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          onUpdate: () => { el.textContent = Math.round(proxy.v) + suffix; },
          onStart: () => { el.textContent = from + suffix; },
        });
      }
    });
  }, root);

  return (
    <section ref={root} id="record" className="shell scroll-mt-28" aria-labelledby="stats-title">
      <div className="card relative isolate bg-ground">
        {/* backdrop */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div data-stats-photo className="absolute -inset-y-[8%] inset-x-0">
            <Image
              src="/media/stats/backdrop.webp"
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
          {/* the ground at 55%, so the panel reads cleanly on top */}
          <div className="absolute inset-0 bg-ground/[0.55]" aria-hidden="true" />
        </div>

        <div className="section-pad px-7 md:px-12 lg:px-14">
          <motion.div
            variants={stagger()}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
            className="flex flex-col items-center text-center"
          >
            <motion.div variants={child}>
              <Eyebrow onNavy>Track record</Eyebrow>
            </motion.div>
            <motion.h2
              id="stats-title"
              variants={child}
              className="mt-6 max-w-[18ch] text-d3 text-white md:text-d2"
            >
              Certified to European standards, maintained locally.
            </motion.h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="mx-auto mt-12 grid max-w-[980px] overflow-hidden rounded-card
                       border border-[var(--color-edge)] bg-surface-2/85 backdrop-blur-md sm:grid-cols-3"
          >
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className={`p-8 text-center md:p-10 ${
                  i ? 'border-t border-[var(--color-edge)] sm:border-l sm:border-t-0' : ''
                }`}
              >
                <p className="tabular text-[2.75rem] font-medium leading-none tracking-[-0.02em] text-green md:text-[3.25rem]">
                  {'text' in s ? (
                    s.text
                  ) : (
                    <span data-count={s.value} data-from={s.from} data-suffix={s.suffix}>
                      {s.value}
                      {s.suffix}
                    </span>
                  )}
                </p>
                <p className="mt-4 text-sm text-white/60">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
