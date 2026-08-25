'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Eyebrow, Reveal } from './ui';
import CertBadge from './CertBadge';
import { stagger, child, VIEWPORT } from '@/lib/motion';

/**
 * About — split card, 55/45. Statement left on white, the Platine Tower
 * install right with a white sub-card overlaid on the photograph.
 */
export default function About() {
  return (
    <section id="about" className="shell scroll-mt-28" aria-labelledby="about-title">
      <div className="card card-surface">
        <div className="grid gap-10 p-7 md:p-12 lg:grid-cols-[minmax(0,55fr)_minmax(0,45fr)] lg:gap-14 lg:p-14">
          <motion.div
            variants={stagger()}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
            className="flex flex-col"
          >
            <motion.div variants={child}>
              <Eyebrow>About us</Eyebrow>
            </motion.div>

            <motion.h2
              id="about-title"
              variants={child}
              className="mt-7 max-w-[24ch] text-[1.75rem] leading-[1.15] tracking-[-0.02em] text-white md:text-d2"
            >
              We design, manufacture, install, and maintain vertical transport across Lebanon and
              Central Africa.
            </motion.h2>

            <motion.p variants={child} className="lede mt-7">
              Started in Beirut in 1983 servicing other manufacturers’ lifts. Today we build our
              own — cabins finished in Hazmieh, drives from Fuji Electric in Japan.
            </motion.p>

            <motion.div
              variants={child}
              className="mt-9 flex flex-wrap gap-x-10 gap-y-6 border-t border-[var(--color-edge)] pt-8"
            >
              <CertBadge standard="EN 81-20 / EN 81-50" body="EU type-examined" />
              <CertBadge standard="ISO 9001" body="Quality management" double />
            </motion.div>
          </motion.div>

          {/* ------------------------------------------------------- photo */}
          <Reveal className="relative min-h-[380px] lg:min-h-[520px]">
            <div className="photo absolute inset-0">
              <Image
                src="/media/about/platine-tower.webp"
                alt="Lift lobby at Platine Tower, Dbayeh"
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="on-light absolute bottom-5 left-5 right-5 rounded-inner bg-white p-5
                         shadow-[var(--shadow-card)] sm:right-auto sm:max-w-[300px]"
            >
              <span className="text-util uppercase tracking-[0.08em] text-slate">
                Featured install
              </span>
              <p className="mt-2 text-d4 text-navy">Platine Tower, Dbayeh</p>
              <p className="mt-2 text-sm text-slate">
                Three passenger cars over nineteen floors plus a dedicated freight lift. Handed over
                in 2022.
              </p>
            </motion.div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
