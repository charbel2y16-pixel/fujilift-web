'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eyebrow } from './ui';
import { reveal, VIEWPORT_TALL } from '@/lib/motion';
import type { Spec } from '@/lib/data';
import { gsap, useGsap, SCROLL_OK, markMoving, unmarkMoving } from '@/lib/gsap';

/**
 * The compact product / project card.
 *
 * The photographic card, for the pages that are about the photographs: the
 * products index and the related-items rails on detail pages. The homepage no
 * longer uses it — there, Selected range and Selected work are ruled lists
 * (see IndexList), because four photo cards each was costing the landing three
 * screens before anyone had read a word.
 *
 * The spec table reads across rather than down. Three stacked rows cost ~138px
 * of card height each, which with a grid of cards was most of a viewport spent
 * on a table nobody compares in place. The full table lives on the detail page.
 */
export default function ItemCard({
  eyebrow,
  title,
  caption,
  description,
  specs,
  image,
  alt,
  href,
  cta,
  priority = false,
}: {
  eyebrow: string;
  title: string;
  caption?: string;
  description: string;
  specs: readonly Spec[];
  image: string;
  alt: string;
  href: string;
  cta: string;
  priority?: boolean;
}) {
  const root = useRef<HTMLLIElement>(null);

  useGsap(({ mm }) => {
    mm.add(SCROLL_OK, () => {
      const photo = root.current?.querySelector<HTMLElement>('[data-card-photo]');
      if (!photo) return;
      markMoving(photo);
      // the offset that keeps the photo feeling layered on the ground, at a
      // scale that suits a grid rather than a full-width row
      const tween = gsap.fromTo(photo, { y: -18 }, {
        y: 18,
        ease: 'none',
        scrollTrigger: {
          trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: 1,
          onLeave: () => unmarkMoving(photo), onEnterBack: () => markMoving(photo),
        },
      });
      return () => { tween.scrollTrigger?.kill(); tween.kill(); };
    });
  }, root);

  return (
    <motion.li
      ref={root}
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT_TALL}
      className="group flex flex-col"
    >
      <Link href={href} className="flex h-full flex-col">
        <span className="photo relative block aspect-[3/2] w-full overflow-hidden">
          <span data-card-photo className="absolute -inset-y-[7%] inset-x-0 block">
            <Image
              src={image}
              alt={alt}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 46vw, 78vw"
              className="object-cover transition-transform duration-700 ease-out
                         group-hover:scale-[1.03]"
            />
          </span>
        </span>

        <span className="mt-5 block">
          <Eyebrow>{eyebrow}</Eyebrow>
        </span>

        <h3 className="mt-4 text-d4 text-white transition-colors duration-300 group-hover:text-green">
          {title}
        </h3>
        {caption ? (
          <p className="mt-2 text-sm text-white/60">{caption}</p>
        ) : null}
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-white/60">{description}</p>

        {/* The same facts the stacked table carried, read across instead of
            down. Three full-width rows cost ~138px of card; as a strip they
            cost about half that, which is most of why these sections used to
            run to two and a half screens. mt-auto pins it to the foot so cards
            of unequal copy still line their specs and links up across a row. */}
        <dl className="tabular mt-auto flex flex-wrap gap-x-7 gap-y-3 border-t border-[var(--color-edge)] pt-4">
          {specs.map((s) => (
            <div key={s.label}>
              <dt className="text-util uppercase tracking-[0.08em] text-white/55">{s.label}</dt>
              <dd className="mt-1.5 text-sm font-medium text-white">{s.value}</dd>
            </div>
          ))}
        </dl>

        <span
          className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-green
                     transition-colors group-hover:text-mint"
        >
          {cta}
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"
            className="transition-transform duration-300 ease-out group-hover:translate-x-1"
          >
            <path d="M2.5 6h7M6.5 2.5 10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.4"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </Link>
    </motion.li>
  );
}
