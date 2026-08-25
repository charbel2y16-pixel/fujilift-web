'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import Magnetic from './Magnetic';
import Rise from './Rise';
import { reveal, stagger, child, VIEWPORT, pressable } from '@/lib/motion';
import type { Spec } from '@/lib/data';

/* --------------------------------------------------------------- eyebrow */

export function Eyebrow({
  children,
  onNavy = false,
  className = '',
}: {
  children: ReactNode;
  /** set on navy surfaces, where the pill needs the light treatment */
  onNavy?: boolean;
  className?: string;
}) {
  return (
    <span className={`eyebrow ${onNavy ? 'eyebrow--on-navy' : ''} ${className}`}>
      {children}
    </span>
  );
}

/* --------------------------------------------------------------- buttons */

const ARROW = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2.5 6h7M6.5 2.5 10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.4"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type CTAProps = {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'outline-navy' | 'outline-white' | 'white' | 'ground';
  arrow?: boolean;
  className?: string;
  /** opt out where the button sits in a tight row and leaning would crowd it */
  magnetic?: boolean;
};

export function CTA({
  href,
  children,
  variant = 'primary',
  arrow = false,
  className = '',
  magnetic = true,
}: CTAProps) {
  const MotionLink = motion.create(Link);
  const button = (
    <MotionLink href={href} className={`btn btn-${variant} ${className}`} {...pressable}>
      {children}
      {arrow && variant === 'primary' ? ARROW : null}
    </MotionLink>
  );
  return magnetic ? <Magnetic>{button}</Magnetic> : button;
}

/* ---------------------------------------------------------------- reveal */

export function Reveal({
  children,
  className = '',
  as = 'div',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'header' | 'li';
  delay?: number;
}) {
  const M = motion[as];
  return (
    <M
      className={className}
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      transition={{ delay }}
    >
      {children}
    </M>
  );
}

/* -------------------------------------------------------- section header */

export function SectionHead({
  eyebrow,
  title,
  titleId,
  sub,
  as = 'h2',
  align = 'center',
  className = '',
}: {
  eyebrow: string;
  /** a plain string gets the word-mask rise; a node is rendered as given */
  title: ReactNode;
  titleId?: string;
  sub?: ReactNode;
  /** 'h1' where this is the page's own heading, not a section within one */
  as?: 'h1' | 'h2';
  /** retained so existing call sites stay valid — light-on-dark is the only
      treatment now that the whole page sits in the film's palette */
  onNavy?: boolean;
  align?: 'center' | 'left';
  className?: string;
}) {
  const centred = align === 'center';
  const Heading = as === 'h1' ? motion.h1 : motion.h2;
  const headingClass = `mt-6 text-d3 text-white md:text-d2 ${
    centred ? 'max-w-[19ch]' : 'max-w-[22ch]'
  }`;
  return (
    <motion.div
      variants={stagger()}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      className={`${centred ? 'text-center items-center' : 'items-start'} flex flex-col ${className}`}
    >
      <motion.div variants={child}>
        <Eyebrow>{eyebrow}</Eyebrow>
      </motion.div>
      {typeof title === 'string' ? (
        <Rise as={as} text={title} id={titleId} className={headingClass} />
      ) : (
        <Heading variants={child} className={headingClass}>
          {title}
        </Heading>
      )}
      {sub ? (
        <motion.p
          variants={child}
          className={`mt-5 text-body text-white/60 ${
            centred ? 'max-w-[54ch]' : 'max-w-[52ch]'
          }`}
        >
          {sub}
        </motion.p>
      ) : null}
    </motion.div>
  );
}

/* ------------------------------------------------------------ spec table */

export function SpecTable({
  specs,
  onNavy = false,
  className = '',
}: {
  specs: readonly Spec[];
  onNavy?: boolean;
  className?: string;
}) {
  return (
    <motion.dl
      className={`tabular ${className}`}
      variants={stagger()}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
    >
      {specs.map((s) => (
        <motion.div
          key={s.label}
          variants={child}
          className={`spec-row ${onNavy ? 'spec-row--on-navy' : ''}`}
        >
          <dt>{s.label}</dt>
          <dd>{s.value}</dd>
        </motion.div>
      ))}
    </motion.dl>
  );
}
