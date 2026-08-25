import type { Variants, Transition } from 'framer-motion';

/**
 * Framer Motion owns component state: entrance reveals, staggers, hover and
 * tap, the mega-menu and the mobile nav. GSAP owns the scroll timeline.
 * Nothing is animated by both.
 */

export const EASE = [0.2, 0.8, 0.2, 1] as const;

export const VIEWPORT = { once: true, amount: 0.3 } as const;
/** For tall sections where 30% of the box is more than a screenful. */
export const VIEWPORT_TALL = { once: true, amount: 0.15 } as const;

/** Section reveal — opacity 0 -> 1, y 16 -> 0, 500ms. */
export const reveal: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/** Parent for staggered children: spec rows, product cards, partner logos. */
export const stagger = (delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren } },
});

export const child: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

/**
 * Grid cells that share edges — the partner wall — where a plain y-shift makes
 * the seams crawl. Settling out of a slight scale keeps the grid rigid while
 * still arriving one cell at a time.
 */
export const tile: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.55, ease: EASE } },
};

export const SPRING: Transition = { type: 'spring', stiffness: 400, damping: 30 };

export const pressable = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: SPRING,
} as const;

/** Cards lift 2px on hover. Nothing rotates, nothing overshoots. */
export const liftable = {
  whileHover: { y: -2 },
  transition: { duration: 0.25, ease: EASE },
} as const;

/** Mega-menu and mobile nav: 220ms height + opacity. */
export const menuTransition: Transition = { duration: 0.22, ease: EASE };

/* ------------------------------------------------------------------ text */

/**
 * Word-mask rise. Each word sits in its own overflow-hidden box and swings up
 * from under it, so the line assembles rather than fading in. The stagger is
 * short on purpose — a heading should finish before you have read it.
 */
export const riseGroup = (delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren } },
});

export const riseWord: Variants = {
  hidden: { y: '110%' },
  show: { y: '0%', transition: { duration: 0.72, ease: EASE } },
};

/** The same idea for a block that should arrive as one piece, not per word. */
export const riseBlock: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/* ------------------------------------------------------- route transition */

/**
 * The curtain that clears off a newly-arrived page. It only ever uncovers:
 * the App Router has already swapped the content by the time we can animate,
 * so covering would be a lie about what is underneath.
 */
export const CURTAIN: Transition = { duration: 0.62, ease: [0.76, 0, 0.24, 1] };
