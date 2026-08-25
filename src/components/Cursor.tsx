'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/**
 * A lift-button cursor: a filled dot that tracks exactly, inside a ring that
 * lags behind it and opens up over anything clickable.
 *
 * WHY IT CHANGES COLOUR RATHER THAN BLENDING. The usual trick for a custom
 * cursor is mix-blend-mode: difference, which guarantees visibility on any
 * background. It cannot be used here: differencing white against the brand
 * mint lands on hot pink, which is not a colour this site owns. So the cursor
 * asks what it is over — the same question the floor rail asks — and takes the
 * ink that surface expects.
 *
 * Only mounts for a fine pointer that can hover, and never under reduced
 * motion; a phone gets nothing, and neither does anyone who asked for still.
 */

type Ink = 'default' | 'accent' | 'light';

const RING: Record<Ink, string> = {
  default: 'var(--color-green)',
  accent: 'var(--color-ground)',
  light: 'var(--color-green-deep)',
};

export default function Cursor() {
  const [on, setOn] = useState(false);
  const [hot, setHot] = useState(false);
  const [ink, setInk] = useState<Ink>('default');
  const frame = useRef(0);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  // the ring trails; the dot does not
  const rx = useSpring(x, { stiffness: 320, damping: 30, mass: 0.5 });
  const ry = useSpring(y, { stiffness: 320, damping: 30, mass: 0.5 });

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || still.matches) return;

    document.documentElement.classList.add('has-cursor');

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      if (!on) setOn(true);

      // reading the tree on every pixel of travel is wasteful — once a frame
      if (frame.current) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        const t = e.target as Element | null;
        if (!t?.closest) return;
        setHot(Boolean(t.closest('a, button, [role="button"], [data-cursor-hot]')));
        setInk(
          t.closest('[data-accent-card]')
            ? 'accent'
            : t.closest('.on-light, .glass')
              ? 'light'
              : 'default',
        );
      });
    };
    const leave = () => setOn(false);

    window.addEventListener('mousemove', move, { passive: true });
    document.addEventListener('mouseleave', leave);
    return () => {
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseleave', leave);
      document.documentElement.classList.remove('has-cursor');
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [on, x, y]);

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[200] hidden rounded-pill lg:block"
        style={{
          x: rx,
          y: ry,
          borderColor: RING[ink],
          borderStyle: 'solid',
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: hot ? 52 : 30,
          height: hot ? 52 : 30,
          opacity: on ? (hot ? 1 : 0.55) : 0,
          borderWidth: hot ? 1.5 : 1,
        }}
        transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[200] hidden rounded-pill lg:block"
        style={{
          x,
          y,
          backgroundColor: RING[ink],
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: hot ? 5 : 4,
          height: hot ? 5 : 4,
          opacity: on ? 1 : 0,
        }}
        transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      />
    </>
  );
}
