'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LogoWordmark } from './Logo';
import { COMPANY, FOOTER_LINKS } from '@/lib/data';
import { reveal, VIEWPORT } from '@/lib/motion';
import { gsap, useGsap, SCROLL_OK, markMoving, unmarkMoving } from '@/lib/gsap';

const SOCIALS = [
  {
    label: 'Facebook', href: COMPANY.social.facebook,
    d: 'M13.5 8.5V6.8c0-.7.2-1.1 1.2-1.1H16V3.1a16 16 0 0 0-2-.1c-2 0-3.4 1.2-3.4 3.5v2H8.4V11h2.2v6.9h2.9V11h2l.3-2.5h-2.3Z',
  },
  {
    label: 'Instagram', href: COMPANY.social.instagram,
    d: 'M10 4.9c1.7 0 1.9 0 2.5.03 1.7.08 2.5.9 2.6 2.6 0 .6.03.8.03 2.5s0 1.9-.03 2.5c-.08 1.7-.9 2.5-2.6 2.6-.6.03-.8.03-2.5.03s-1.9 0-2.5-.03c-1.7-.08-2.5-.9-2.6-2.6C4.9 11.9 4.9 11.7 4.9 10s0-1.9.03-2.5c.08-1.7.9-2.5 2.6-2.6C8.1 4.9 8.3 4.9 10 4.9Zm0-1.2c-1.7 0-2 0-2.6.04-2.3.1-3.6 1.4-3.7 3.7C3.7 8 3.7 8.3 3.7 10s0 2 .04 2.6c.1 2.3 1.4 3.6 3.7 3.7.6.04.9.04 2.6.04s2 0 2.6-.04c2.3-.1 3.6-1.4 3.7-3.7.04-.6.04-.9.04-2.6s0-2-.04-2.6c-.1-2.3-1.4-3.6-3.7-3.7-.6-.04-.9-.04-2.6-.04Zm0 3a3.2 3.2 0 1 0 0 6.5 3.2 3.2 0 0 0 0-6.5Zm0 5.3a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2Zm3.3-6.2a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z',
  },
  {
    label: 'LinkedIn', href: COMPANY.social.linkedin,
    d: 'M6.5 16.3H4V8.1h2.5v8.2ZM5.2 7A1.5 1.5 0 1 1 5.2 4a1.5 1.5 0 0 1 0 3Zm11.1 9.3h-2.5v-4c0-.95-.02-2.2-1.3-2.2-1.3 0-1.5 1-1.5 2.1v4.1H8.5V8.1H11v1.1h.03a2.7 2.7 0 0 1 2.5-1.4c2.6 0 3.1 1.7 3.1 4v4.5Z',
  },
];

/**
 * Footer — navy, closing on the wordmark in the brand green, set to the full
 * width of the card. It rises 60px into place as the footer enters, revealing
 * itself from behind the contact block.
 */
export default function Footer() {
  const root = useRef<HTMLElement>(null);

  useGsap(({ mm }) => {
    mm.add(SCROLL_OK, () => {
      const mark = root.current?.querySelector<HTMLElement>('[data-footer-mark]');
      if (!mark) return;
      markMoving(mark);
      gsap.fromTo(mark, { y: 60 }, {
        y: 0, ease: 'none',
        scrollTrigger: {
          trigger: root.current, start: 'top bottom', end: 'bottom bottom', scrub: 1,
          onLeave: () => unmarkMoving(mark), onEnterBack: () => markMoving(mark),
        },
      });
    });
  }, root);

  return (
    <footer ref={root} className="relative z-10 shell pb-[var(--gutter)]" aria-labelledby="footer-title">
      <div className="card card-surface">
        <div className="px-7 pt-[56px] md:px-12 md:pt-[96px] lg:px-14">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-20">
            {/* ------------------------------------------------- statement */}
            <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={VIEWPORT}>
              <h2 id="footer-title" className="max-w-[14ch] text-d3 text-white md:text-d2">
                Move people. Move buildings forward.
              </h2>

              <div id="contact" className="mt-12 grid gap-10 scroll-mt-28 sm:grid-cols-2">
                <div>
                  <p className="text-util uppercase tracking-[0.08em] text-white/55">
                    {COMPANY.lebanon.label}
                  </p>
                  <address className="mt-4 not-italic text-sm leading-relaxed text-white/70">
                    {COMPANY.lebanon.address}
                    <br />
                    <a className="transition-colors hover:text-white" href={`tel:${COMPANY.lebanon.phoneHref}`}>
                      {COMPANY.lebanon.phone}
                    </a>
                    <br />
                    <a className="transition-colors hover:text-white" href={`tel:${COMPANY.lebanon.officeHref}`}>
                      {COMPANY.lebanon.office}
                    </a>
                    <br />
                    <a className="transition-colors hover:text-white" href={`mailto:${COMPANY.email}`}>
                      {COMPANY.email}
                    </a>
                  </address>
                </div>

                <div>
                  <p className="text-util uppercase tracking-[0.08em] text-white/55">
                    {COMPANY.kinshasa.label}
                  </p>
                  <address className="mt-4 not-italic text-sm leading-relaxed text-white/70">
                    {COMPANY.kinshasa.phones.map((p, i) => (
                      <span key={p}>
                        <a className="transition-colors hover:text-white" href={`tel:${COMPANY.kinshasa.phoneHrefs[i]}`}>
                          {p}
                        </a>
                        <br />
                      </span>
                    ))}
                    <a className="transition-colors hover:text-white" href={`mailto:${COMPANY.support}`}>
                      {COMPANY.support}
                    </a>
                  </address>
                </div>
              </div>
            </motion.div>

            {/* ----------------------------------------------- link columns */}
            <motion.nav
              variants={reveal}
              initial="hidden"
              whileInView="show"
              viewport={VIEWPORT}
              aria-label="Footer"
              className="grid grid-cols-2 gap-12 sm:gap-20"
            >
              {FOOTER_LINKS.map((col) => (
                <div key={col.title}>
                  <p className="text-util uppercase tracking-[0.08em] text-white/55">{col.title}</p>
                  <ul className="mt-4 space-y-2.5">
                    {col.links.map((l) => (
                      <li key={l.href}>
                        <Link href={l.href} className="text-sm text-white/70 transition-colors hover:text-white">
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </motion.nav>
          </div>

          {/* ------------------------------------------------------ socials */}
          <div className="mt-14 flex flex-wrap items-center justify-between gap-6 border-t border-white/10 pt-7">
            <ul className="flex items-center gap-2">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={s.label}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/15
                               text-white/60 transition-colors hover:border-white/40 hover:text-white"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d={s.d} />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-util uppercase tracking-[0.08em] text-white/55">
              © {new Date().getFullYear()} Fujilift · Hazmieh · Kinshasa
            </p>
          </div>
        </div>

        {/* ---------------------------------------------- closing wordmark */}
        {/* Full width, not oversized. It used to run to 124% and hang off both
           edges, which read as a crop rather than a flourish — the name was
           the one thing on the page you could not read in full. overflow-hidden
           stays: it is what masks the 60px rise, not a horizontal crop. */}
        <div className="mt-10 overflow-hidden md:mt-14">
          <div data-footer-mark className="w-full">
            <LogoWordmark tone="green" className="block h-auto w-full" aria-hidden="true" />
          </div>
        </div>
      </div>
    </footer>
  );
}
