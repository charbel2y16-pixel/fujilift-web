'use client';

import { useLayoutEffect, useRef, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
  // A phone's URL bar sliding away is a viewport resize, and a resize is a
  // refresh, and a refresh mid-pin is a visible jump. Since the hero pins on
  // touch now, that jump is reachable — so ignore height-only resizes there.
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger };

/** Desktop only — parallax is disabled below 768px (brief §9). */
export const DESKTOP = '(min-width: 768px)';
/** Its counterpart, for the one effect phones do get: the hero film. */
export const TOUCH = '(max-width: 767px)';
export const MOTION_OK = '(prefers-reduced-motion: no-preference)';
/** Everything scroll-driven is gated on both. */
export const SCROLL_OK = `${DESKTOP} and ${MOTION_OK}`;
/**
 * The hero is the single exception to "no pinning on phones": its film is the
 * page's opening argument, and playing it on a clock instead of on scroll made
 * it decoration. Nothing else below 768px should reach for this.
 */
export const TOUCH_SCROLL_OK = `${TOUCH} and ${MOTION_OK}`;

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Registers ScrollTriggers inside a gsap.context scoped to `scope`, reverting
 * on unmount. `setup` receives a matchMedia instance — add conditions with
 * `mm.add(SCROLL_OK, () => { ... })` so timelines are created only where they
 * are allowed and torn down automatically when the query stops matching.
 */
export function useGsap(
  setup: (ctx: { mm: gsap.MatchMedia; self: gsap.Context }) => void,
  scope: RefObject<HTMLElement | null>,
  deps: unknown[] = [],
) {
  const saved = useRef(setup);
  saved.current = setup;

  useLayoutEffect(() => {
    if (!scope.current) return;
    const ctx = gsap.context((self) => {
      const mm = gsap.matchMedia();
      saved.current({ mm, self });
    }, scope);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** will-change is set for the life of a scrub and dropped afterwards. */
export function markMoving(el: Element | null) {
  el?.classList.add('will-move');
}
export function unmarkMoving(el: Element | null) {
  el?.classList.remove('will-move');
}
