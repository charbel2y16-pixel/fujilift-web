'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { LogoMark } from './Logo';
import { CURTAIN } from '@/lib/motion';
import { ScrollTrigger } from '@/lib/gsap';

/**
 * Route transition: a car passing through the frame.
 *
 * The panel rises from below to cover the page, the route swaps behind it, and
 * it keeps travelling in the same direction to uncover the new one. One
 * continuous upward move, which is the only transition a lift company should
 * ship.
 *
 * WHY IT INTERCEPTS CLICKS. The App Router gives no exit hook — by the time a
 * route change is observable the new page has already rendered, so a curtain
 * driven off `usePathname` alone can only ever uncover, and covering after the
 * swap would flash the new page first. So the click is caught, the cover is
 * played, and only then is the navigation handed to the router.
 *
 * Everything that would make that interception wrong is excluded: modified
 * clicks, non-left buttons, new tabs, downloads, external hosts, hash links
 * (SmoothScroll owns those) and navigations to the page you are already on.
 * Back/forward is not intercepted — it arrives with no cover, so it simply
 * gets no curtain rather than a half one.
 */

const SAFETY_MS = 1600;

export default function RouteCurtain() {
  const path = usePathname();
  const router = useRouter();
  const still = useReducedMotion();

  const [phase, setPhase] = useState<'idle' | 'covering' | 'uncovering'>('idle');
  const pending = useRef<string | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const go = useCallback(
    (href: string) => {
      setPhase('covering');
      pending.current = href;
      later(() => router.push(href), CURTAIN.duration! * 1000);
      // if the route never arrives, do not leave the page behind a panel
      later(() => {
        if (pending.current) {
          pending.current = null;
          setPhase('idle');
        }
      }, SAFETY_MS);
    },
    [router],
  );

  useEffect(() => {
    if (still) return;

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const a = (e.target as HTMLElement)?.closest?.('a');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || !href.startsWith('/') || href.includes('#')) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      if (href === path) return;

      e.preventDefault();
      go(href);
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [path, still, go]);

  // the new route has landed — keep travelling
  useEffect(() => {
    if (!pending.current) return;
    pending.current = null;
    clearTimers();
    setPhase('uncovering');
    later(() => {
      setPhase('idle');
      // the new page measured while it was behind a panel; re-measure it
      ScrollTrigger.refresh();
    }, CURTAIN.duration! * 1000);
    return clearTimers;
  }, [path]);

  useEffect(() => clearTimers, []);

  if (still || phase === 'idle') return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[150] flex items-center justify-center bg-navy-deep"
      initial={{ y: phase === 'covering' ? '100%' : '0%' }}
      animate={{ y: phase === 'covering' ? '0%' : '-100%' }}
      transition={CURTAIN}
    >
      <motion.span
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{
          opacity: phase === 'covering' ? 1 : 0,
          scale: phase === 'covering' ? 1 : 1.04,
        }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <LogoMark size={40} tone="green" />
      </motion.span>
    </motion.div>
  );
}
