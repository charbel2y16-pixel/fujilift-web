'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

/**
 * Magnetic pointer attraction.
 *
 * While the cursor is inside the element, it leans toward it by a fraction of
 * the offset from centre, and springs back when the cursor leaves. `strength`
 * is that fraction — 0.3 is a lean, 1.0 would glue the element to the cursor.
 *
 * Deliberately does nothing on touch or under reduced motion: there is no
 * hover on a phone, so the handlers would only ever fire as a jump on tap.
 * The wrapper stays in the tree either way so layout never depends on it.
 */
export default function Magnetic({
  children,
  strength = 0.28,
  className = '',
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const still = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 22, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 260, damping: 22, mass: 0.4 });

  const track = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el || still) return;
    // no hover to speak of on a coarse pointer — leave it alone
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };

  const release = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.span
      ref={ref}
      onMouseMove={track}
      onMouseLeave={release}
      style={still ? undefined : { x: sx, y: sy }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.span>
  );
}
