'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { SectionHead, Reveal } from './ui';
import { VIEWPORT } from '@/lib/motion';

/**
 * Studio band — full-width navy card. Two photographs, factory floor and
 * showroom, with a white sub-card carrying the Hazmieh line.
 *
 * These are the only photographs left on the landing page, and they are held
 * to a letterbox crop rather than the portrait one they started in: the two
 * of them at 4:5 were most of a screen and a half on their own. The sub-card
 * only overlays the frame from sm upward — laid over a phone-width photo it
 * covered the thing it was captioning.
 */
export default function Studio() {
  return (
    <section id="factory" className="shell scroll-mt-28" aria-labelledby="factory-title">
      <div className="card card-surface">
        <div className="section-pad px-7 md:px-12 lg:px-14">
          <SectionHead
            eyebrow="Our factory"
            title="Built here, not just assembled here."
            titleId="factory-title"
            sub="Sheet steel arrives in Hazmieh and leaves as a finished cabin."
            className="mx-auto max-w-[760px]"
          />

          <div className="mt-14 grid gap-[var(--rhythm)] md:grid-cols-2">
            <Reveal>
              {/* the grid stretches this cell to match its neighbour, so the
                  sub-card is anchored to the photo rather than to the cell */}
              <div className="relative">
                <div className="photo aspect-[16/9] md:aspect-[16/10]">
                <Image
                  src="/media/studio/factory.webp"
                  alt="Fujilift technician at a press brake on the Hazmieh factory floor"
                  fill
                  sizes="(min-width: 768px) 45vw, 100vw"
                    className="object-cover"
                  />
                </div>

                <motion.div
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEWPORT}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="on-light relative mt-4 rounded-inner bg-white p-5 shadow-[var(--shadow-card)]
                           sm:absolute sm:bottom-5 sm:left-5 sm:right-auto sm:mt-0 sm:max-w-[320px]"
              >
                  <span className="text-util uppercase tracking-[0.08em] text-slate">
                    Hazmieh, Lebanon
                  </span>
                  <p className="mt-2 text-d4 text-navy">Certified assembly line</p>
                  <p className="mt-2 text-sm text-slate">
                    Set up with Japanese engineers in 2018.
                  </p>
                </motion.div>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="photo aspect-[16/9] md:aspect-[16/10]">
                <Image
                  src="/media/studio/showroom.webp"
                  alt="Vacuum elevator on display in the Fujilift showroom"
                  fill
                  sizes="(min-width: 768px) 45vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <span className="text-util uppercase tracking-[0.08em] text-white/55 whitespace-nowrap sm:order-2">
                  Showroom
                </span>
                <p className="max-w-[38ch] text-sm text-white/60 sm:order-1">
                  A working cabin, a vacuum lift and a chairlift you can ride before you specify one.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
