'use client';

import { motion } from 'framer-motion';
import { CTA, Eyebrow } from './ui';
import { stagger, child, VIEWPORT } from '@/lib/motion';

/**
 * Maintenance — the one full-bleed accent card. This replaces the pop-up nag
 * on the current site: the same offer, asked once, in its own place.
 *
 * Everything here runs dark-on-mint rather than the white-on-accent the orange
 * carried. That is not a preference: white on #00ff9a is 1.33:1 and the
 * heading would effectively disappear. Ground on it is 12.1:1.
 */
export default function MaintenanceCTA() {
  return (
    <section id="maintenance" className="shell scroll-mt-28" aria-labelledby="maintenance-title">
      <div className="card bg-green" data-accent-card>
        <motion.div
          variants={stagger()}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          className="section-pad flex flex-col items-center px-7 text-center md:px-12 lg:px-14"
        >
          <motion.div variants={child}>
            <Eyebrow className="eyebrow--on-accent">Maintenance</Eyebrow>
          </motion.div>

          <motion.h2
            id="maintenance-title"
            variants={child}
            className="mt-7 max-w-[16ch] text-d2 text-ground md:text-[3.5rem] md:leading-[1.06] md:tracking-[-0.03em]"
          >
            Free elevator inspection.
          </motion.h2>

          <motion.p variants={child} className="mt-6 max-w-[54ch] text-body text-ground/75">
Any elevator in your building, ours or not. Written condition report, no obligation.
          </motion.p>

          <motion.div variants={child} className="mt-9">
            <CTA href="/#contact" variant="ground">
              Book an inspection
            </CTA>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
