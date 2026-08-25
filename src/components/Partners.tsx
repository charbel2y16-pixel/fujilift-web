'use client';

import { motion } from 'framer-motion';
import { SectionHead } from './ui';
import { PARTNERS } from '@/lib/data';
import { stagger, child, tile, VIEWPORT } from '@/lib/motion';

/**
 * Partners — light card. Twelve supplier marks rendered single-tone navy at
 * 40%, lifting to full navy on hover, with one white sub-card breaking the
 * grid for the Fuji Electric relationship.
 */
export default function Partners() {
  return (
    <section id="partners" className="shell scroll-mt-28" aria-labelledby="partners-title">
      <div className="card card-surface">
        <div className="section-pad px-7 md:px-12 lg:px-14">
          <SectionHead
            eyebrow="Our network"
            title="Sourced from the best in the industry."
            titleId="partners-title"
            sub="Drives, traction machines and door gear from the manufacturers that set the standard."
            className="mx-auto max-w-[760px]"
          />

          <motion.ul
            variants={stagger(0.1)}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
            className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-inner bg-white/10
                       sm:grid-cols-3 lg:grid-cols-4"
          >
            {PARTNERS.slice(0, 4).map((p) => (
              <Logo key={p.file} name={p.name} file={p.file} />
            ))}

            {/* the sub-card that breaks the grid */}
            <motion.li
              variants={child}
              className="on-light col-span-2 bg-white p-7 sm:col-span-3 lg:col-span-2 lg:row-span-2"
            >
              <span className="eyebrow eyebrow--on-light">Japan</span>
              <p className="mt-6 text-d4">Drives and controllers from Fuji Electric.</p>
              <p className="mt-3 text-sm text-slate">
                The Hazmieh line was set up with Japanese engineers to FUJI guidelines. It is why a
                Fujilift car runs at 2.5 amps, and why the motor carries a lifetime warranty.
              </p>
            </motion.li>

            {PARTNERS.slice(4).map((p) => (
              <Logo key={p.file} name={p.name} file={p.file} />
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}

function Logo({ name, file }: { name: string; file: string }) {
  return (
    <motion.li
      variants={tile}
      className="partner grid aspect-[3/2] place-items-center bg-surface-2 p-6 sm:aspect-[2/1]"
    >
      <span
        className="partner-logo h-full w-full"
        style={{ ['--logo' as string]: `url(/media/partners/${file}.png)` }}
        role="img"
        aria-label={name}
      />
    </motion.li>
  );
}
