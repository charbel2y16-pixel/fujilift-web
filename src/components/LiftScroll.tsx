'use client';

import { useRef } from 'react';
import { Eyebrow } from './ui';
import { motion } from 'framer-motion';
import { stagger, child, VIEWPORT } from '@/lib/motion';
import { gsap, useGsap, MOTION_OK } from '@/lib/gsap';

/**
 * A quiet counterpoint to the hero: the same machine drawn flat, as a section
 * through the shaft. The car rides up as the section scrolls past, the
 * counterweight drops, the ropes follow. No photography, no parallax, nothing
 * else moving.
 *
 * Geometry is hand-placed here rather than projected — the whole point is that
 * it is simple.
 */

const W = 460, H = 620;
const SHAFT = { x0: 150, x1: 310, top: 62, bottom: 578 };
const CAR = { x0: 158, x1: 268, h: 86 };
const CW = { x0: 280, x1: 302, h: 62 };
const CAR_CX = (CAR.x0 + CAR.x1) / 2;
const CW_CX = (CW.x0 + CW.x1) / 2;
const SHEAVE = { cx: (CAR_CX + CW_CX) / 2, cy: 74, r: (CW_CX - CAR_CX) / 2 };

const LEVELS = [578, 482, 386, 290, 194, 98];
const CAR_TRAVEL = { low: 490, high: 132 };   // car top, ground floor -> top floor
const CW_TRAVEL = { low: 148, high: 496 };    // counterweight top, in opposition

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const r1 = (v: number) => Math.round(v * 10) / 10;

/** Rope: up from the car, over the sheave, down to the counterweight. */
const rope = (carTop: number, cwTop: number) =>
  `M${CAR_CX} ${r1(carTop)}L${CAR_CX} ${SHEAVE.cy}` +
  `A${SHEAVE.r} ${SHEAVE.r} 0 0 1 ${CW_CX} ${SHEAVE.cy}` +
  `L${CW_CX} ${r1(cwTop)}`;

export default function LiftScroll() {
  const root = useRef<HTMLElement>(null);

  useGsap(({ mm }) => {
    const svg = root.current?.querySelector<SVGSVGElement>('[data-lift]');
    if (!svg) return;

    const car = svg.querySelector<SVGGElement>('[data-lift-car]');
    const cw = svg.querySelector<SVGGElement>('[data-lift-cw]');
    const line = svg.querySelector<SVGPathElement>('[data-lift-rope]');

    const place = (t: number) => {
      const carTop = lerp(CAR_TRAVEL.low, CAR_TRAVEL.high, t);
      const cwTop = lerp(CW_TRAVEL.low, CW_TRAVEL.high, t);
      car?.setAttribute('transform', `translate(0 ${r1(carTop - CAR_TRAVEL.low)})`);
      cw?.setAttribute('transform', `translate(0 ${r1(cwTop - CW_TRAVEL.low)})`);
      line?.setAttribute('d', rope(carTop, cwTop));
    };

    mm.add(MOTION_OK, () => {
      // draw the structure on once, then hand the car over to the scrubber
      const paths = Array.from(
        svg.querySelectorAll<SVGGeometryElement>('[data-struct] path, [data-struct] circle'),
      );
      for (const p of paths) {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      }
      const draw = gsap.to(paths, {
        strokeDashoffset: 0,
        duration: 1.1,
        ease: 'power2.inOut',
        stagger: { amount: 0.5 },
        scrollTrigger: { trigger: root.current, start: 'top 75%', once: true },
        onComplete: () => gsap.set(paths, { strokeDasharray: 'none' }),
      });

      const progress = { t: 0 };
      const ride = gsap.to(progress, {
        t: 1,
        ease: 'none',
        onUpdate: () => place(progress.t),
        scrollTrigger: {
          trigger: root.current,
          start: 'top 80%',
          end: 'bottom 25%',
          scrub: 1,
        },
      });

      return () => { draw.kill(); ride.kill(); };
    });
  }, root);

  const stroke = {
    stroke: 'var(--color-sky)',
    strokeLinecap: 'round' as const,
    vectorEffect: 'non-scaling-stroke' as const,
  };

  return (
    <section ref={root} id="lift" className="shell scroll-mt-28" aria-labelledby="lift-title">
      <div className="card card-surface">
        <div className="section-pad grid items-center gap-12 px-7 md:px-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 lg:px-14">
          <motion.div
            variants={stagger()}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            <motion.div variants={child}>
              <Eyebrow onNavy>How a lift works</Eyebrow>
            </motion.div>
            <motion.h2
              id="lift-title"
              variants={child}
              className="mt-7 max-w-[15ch] text-d3 text-white md:text-d2"
            >
              Two masses, one rope, thirty years of quiet.
            </motion.h2>
            <motion.p variants={child} className="lede mt-6 max-w-[40ch]">
The counterweight carries the car plus half its load, so the motor only ever moves the
              difference.
            </motion.p>

            <motion.dl
              variants={child}
              className="mt-10 grid max-w-[420px] grid-cols-3 gap-8 border-t border-[var(--color-edge)] pt-7"
            >
              {[
                ['Drive', 'Gearless'],
                ['Roping', '1:1'],
                ['Current', '2.5 A'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-util uppercase tracking-[0.08em] text-white/55">{k}</dt>
                  <dd className="mt-2 text-d4 tabular text-white">{v}</dd>
                </div>
              ))}
            </motion.dl>
          </motion.div>

          <div className="relative mx-auto w-full max-w-[420px]">
            <svg
              data-lift
              viewBox={`0 0 ${W} ${H}`}
              className="block h-auto w-full"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <g data-struct>
                {/* landings, running past the shaft on both sides */}
                {LEVELS.map((y) => (
                  <path key={`l${y}`} d={`M0 ${y}H${W}`} strokeWidth={0.75} strokeOpacity={0.18} {...stroke} />
                ))}
                {/* shaft walls */}
                <path d={`M${SHAFT.x0} ${SHAFT.bottom}V${SHAFT.top}`} strokeWidth={1.25} strokeOpacity={0.45} {...stroke} />
                <path d={`M${SHAFT.x1} ${SHAFT.bottom}V${SHAFT.top}`} strokeWidth={1.25} strokeOpacity={0.45} {...stroke} />
                {/* head and pit */}
                <path d={`M${SHAFT.x0} ${SHAFT.top}H${SHAFT.x1}`} strokeWidth={1.25} strokeOpacity={0.45} {...stroke} />
                <path d={`M${SHAFT.x0} ${SHAFT.bottom}H${SHAFT.x1}`} strokeWidth={1.25} strokeOpacity={0.45} {...stroke} />
                {/* guide rails */}
                <path d={`M${CAR.x0 - 4} ${SHAFT.bottom}V${SHAFT.top}`} strokeWidth={0.75} strokeOpacity={0.32} {...stroke} />
                <path d={`M${CAR.x1 + 4} ${SHAFT.bottom}V${SHAFT.top}`} strokeWidth={0.75} strokeOpacity={0.32} {...stroke} />
                {/* landing door openings */}
                {LEVELS.map((y) => (
                  <path
                    key={`d${y}`}
                    d={`M${CAR.x0} ${y}V${y - 62}H${CAR.x1}V${y}`}
                    strokeWidth={0.75}
                    strokeOpacity={0.3}
                    {...stroke}
                  />
                ))}
                {/* buffers */}
                <path d={`M${CAR_CX} ${SHAFT.bottom}v-16`} strokeWidth={0.75} strokeOpacity={0.32} {...stroke} />
                <path d={`M${CW_CX} ${SHAFT.bottom}v-16`} strokeWidth={0.75} strokeOpacity={0.32} {...stroke} />
                {/* traction sheave */}
                <circle cx={SHEAVE.cx} cy={SHEAVE.cy} r={SHEAVE.r} strokeWidth={1.25} strokeOpacity={0.45} {...stroke} />
                <circle cx={SHEAVE.cx} cy={SHEAVE.cy} r={SHEAVE.r * 0.3} strokeWidth={0.75} strokeOpacity={0.32} {...stroke} />
                {/* ground datum */}
                <path d={`M0 ${SHAFT.bottom}H${W}`} strokeWidth={0.75} strokeOpacity={0.3} {...stroke} />
              </g>

              <path
                data-lift-rope
                d={rope(CAR_TRAVEL.low, CW_TRAVEL.low)}
                strokeWidth={0.75}
                strokeOpacity={0.42}
                {...stroke}
              />

              <g data-lift-car>
                <rect
                  x={CAR.x0} y={CAR_TRAVEL.low} width={CAR.x1 - CAR.x0} height={CAR.h}
                  rx="2" strokeWidth={1.25} strokeOpacity={0.62} {...stroke}
                />
                <path d={`M${CAR_CX} ${CAR_TRAVEL.low + 8}V${CAR_TRAVEL.low + CAR.h - 8}`}
                  strokeWidth={0.75} strokeOpacity={0.32} {...stroke} />
                <path d={`M${CAR.x0 + 8} ${CAR_TRAVEL.low + CAR.h - 5}H${CAR.x1 - 8}`}
                  strokeWidth={0.75} strokeOpacity={0.32} {...stroke} />
              </g>

              <g data-lift-cw>
                <rect
                  x={CW.x0} y={CW_TRAVEL.low} width={CW.x1 - CW.x0} height={CW.h}
                  rx="1.5" strokeWidth={1.25} strokeOpacity={0.62} {...stroke}
                />
                {[0.25, 0.5, 0.75].map((f) => (
                  <path
                    key={f}
                    d={`M${CW.x0} ${CW_TRAVEL.low + CW.h * f}H${CW.x1}`}
                    strokeWidth={0.75} strokeOpacity={0.32} {...stroke}
                  />
                ))}
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
