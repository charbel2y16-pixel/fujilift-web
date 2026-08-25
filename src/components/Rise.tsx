'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ElementType } from 'react';
import { riseGroup, riseWord, VIEWPORT } from '@/lib/motion';

/**
 * Word-mask rise for headings.
 *
 * Every word gets its own overflow-hidden box and swings up from underneath
 * it, so a heading assembles itself instead of fading in as a block. Lines are
 * not measured — words are the unit, and the browser still wraps them
 * normally, which is what keeps this responsive without a resize observer.
 *
 * TWO THINGS THAT ARE EASY TO GET WRONG HERE:
 *
 * Descenders. A mask that is exactly the line box clips the tails off g, y, p
 * and j. The box is extended downward by a fraction of an em and pulled back
 * up by the same amount in margin, so the tails have somewhere to be without
 * the heading gaining height.
 *
 * Screen readers. Splitting a sentence into per-word elements invites some
 * readers to announce it word by word. The real string is exposed once on the
 * wrapper and the pieces are hidden, so it is read as one phrase.
 */
export default function Rise({
  text,
  as: Tag = 'span',
  className = '',
  delay = 0,
  /** play on mount rather than on scroll — for content already on screen */
  immediate = false,
  id,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  delay?: number;
  immediate?: boolean;
  id?: string;
}) {
  const still = useReducedMotion();
  const MotionTag = motion.create(Tag as ElementType);

  // Reduced motion gets the words, in place, with nothing moving.
  if (still) {
    return (
      <Tag id={id} className={className}>
        {text}
      </Tag>
    );
  }

  const words = text.split(' ');

  return (
    <MotionTag
      id={id}
      className={className}
      variants={riseGroup(delay)}
      initial="hidden"
      aria-label={text}
      {...(immediate
        ? { animate: 'show' }
        : { whileInView: 'show', viewport: VIEWPORT })}
    >
      {words.map((word, i) => (
        <span key={`${word}-${i}`} aria-hidden="true">
          <span
            className="inline-block overflow-hidden align-bottom pb-[0.14em] -mb-[0.14em]"
          >
            <motion.span variants={riseWord} className="inline-block">
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </MotionTag>
  );
}
