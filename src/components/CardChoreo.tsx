'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { gsap, ScrollTrigger, MOTION_OK } from '@/lib/gsap';

/**
 * The stacked cards arrive as cards.
 *
 * Every section already animates its own contents; what none of them did was
 * animate the card itself, so the page read as text appearing inside frames
 * that were always there. This lifts each frame into place first, which is
 * what makes the stack feel like it is being assembled as you descend.
 *
 * Batched rather than one trigger per card: cards that enter together animate
 * together with a stagger, instead of firing a dozen independent tweens on the
 * same frame.
 *
 * The hidden state is set from JS, never CSS — without script the cards are
 * simply visible, which is the behaviour anything that cannot run this needs.
 * Re-runs per route because the App Router swaps <main>'s children underneath
 * a layout that does not remount.
 */
export default function CardChoreo() {
  const path = usePathname();

  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add(MOTION_OK, () => {
      const cards = gsap.utils.toArray<HTMLElement>('main .card');
      if (!cards.length) return;

      gsap.set(cards, { opacity: 0, y: 48 });

      const triggers = ScrollTrigger.batch(cards, {
        start: 'top 90%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.09,
            overwrite: true,
          }),
      });

      // whatever is already on screen at mount has no enter to wait for
      ScrollTrigger.refresh();

      return () => {
        triggers.forEach((t) => t.kill());
        gsap.set(cards, { clearProps: 'opacity,transform' });
      };
    });

    return () => mm.revert();
  }, [path]);

  return null;
}
