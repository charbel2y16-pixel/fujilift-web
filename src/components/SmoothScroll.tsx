'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/gsap';

/**
 * Lenis drives the scroll; ScrollTrigger is updated from it so the two never
 * fight. Under reduced motion Lenis is skipped entirely — native scrolling,
 * no smoothing, no rAF loop.
 *
 * ScrollTrigger.refresh() runs once fonts and images have settled, so pinned
 * and scrubbed positions are measured against the final layout.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) {
      ScrollTrigger.refresh();
      return;
    }

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // in-page anchors go through Lenis so they land in the right place
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest?.('a[href^="/#"], a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute('href') ?? '';
      const id = href.slice(href.indexOf('#'));
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -96 });
    };
    document.addEventListener('click', onClick);

    let refreshed = false;
    const refresh = () => {
      if (refreshed) return;
      refreshed = true;
      ScrollTrigger.refresh();
    };
    Promise.allSettled([
      document.fonts?.ready ?? Promise.resolve(),
      new Promise<void>((r) => {
        if (document.readyState === 'complete') r();
        else window.addEventListener('load', () => r(), { once: true });
      }),
    ]).then(refresh);
    const fallback = window.setTimeout(refresh, 2500);

    return () => {
      window.clearTimeout(fallback);
      document.removeEventListener('click', onClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return null;
}
