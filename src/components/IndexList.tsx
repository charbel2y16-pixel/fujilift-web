'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { stagger, child, VIEWPORT } from '@/lib/motion';
import type { Spec } from '@/lib/data';

/**
 * The landing-page index: a set of things as a technical contents list.
 *
 * Selected range and Selected work used to run four photo cards each, which
 * came to two and a half screens on desktop and three on a phone — the two
 * sections were 40% of the homepage between them, before anyone had read a
 * word. The photography is the right treatment on the products index and on
 * each detail page, where a person has already chosen to look. On the landing
 * it was paying a screen and a half per section to say "we make four things".
 *
 * So the landing states them and gets out of the way: a ruled list, name and
 * the two comparable facts, one row each. The photographs still exist — they
 * are one click away, on the pages that are about them.
 */

export type IndexItem = {
  href: string;
  /** the small line above the name — a tagline, or a completion year */
  eyebrow: string;
  title: string;
  /** location, or anything that qualifies the name */
  caption?: string;
  specs: readonly Spec[];
};

export default function IndexList({ items }: { items: readonly IndexItem[] }) {
  return (
    <motion.ul
      variants={stagger(0.05)}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      className="mt-12 border-t border-[var(--color-edge)]"
    >
      {items.map((item) => (
        <motion.li key={item.href} variants={child} className="border-b border-[var(--color-edge)]">
          <Link
            href={item.href}
            /* The whole row is the target — full width and generous height, so
               it is a comfortable tap on a phone rather than a link-sized
               sliver.

               `auto` on the spec track, not a fraction: an auto track sizes to
               the dl's fixed width, which is identical in every row, so the
               spec columns line up down the list. With a fraction they sized to
               their own row's content and the headings stepped left and right
               as the values changed length — unreadable in a list whose whole
               job is comparison. */
            className="group grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-6 gap-y-5
                       py-7 transition-colors
                       md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center md:gap-x-10"
          >
            <span className="block">
              <span className="text-util uppercase tracking-[0.08em] text-white/55">
                {item.eyebrow}
              </span>
              <span className="mt-2 block text-d4 font-[550] text-white transition-colors
                               duration-300 group-hover:text-green">
                {item.title}
              </span>
              {item.caption ? (
                <span className="mt-1.5 block text-sm text-white/55">{item.caption}</span>
              ) : null}
            </span>

            {/* Two fixed columns rather than wrapped flex: on a phone that
                keeps the pair side by side instead of stacking, and on desktop
                the fixed width is what makes the columns agree across rows. */}
            <dl className="tabular col-span-2 grid grid-cols-2 gap-x-6 gap-y-3
                           md:col-span-1 md:w-[360px] md:gap-x-8">
              {item.specs.map((s) => (
                <div key={s.label} className="md:text-right">
                  <dt className="text-util uppercase tracking-[0.08em] text-white/55">{s.label}</dt>
                  <dd className="mt-1.5 text-sm font-medium text-white">{s.value}</dd>
                </div>
              ))}
            </dl>

            <span
              aria-hidden="true"
              className="col-start-2 row-start-1 grid h-10 w-10 shrink-0 place-items-center
                         rounded-pill border border-[var(--color-edge)] text-white/50
                         transition-all duration-300 group-hover:border-green
                         group-hover:bg-green group-hover:text-ground
                         md:col-start-3 md:row-start-1"
            >
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2.5 6h7M6.5 2.5 10 6l-3.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </Link>
        </motion.li>
      ))}
    </motion.ul>
  );
}
