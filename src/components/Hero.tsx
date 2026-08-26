'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import Logo from './Logo';
import { CTA, Eyebrow } from './ui';
import { COMPANY } from '@/lib/data';
import { EASE } from '@/lib/motion';
import { gsap, ScrollTrigger, useGsap, SCROLL_OK, TOUCH_SCROLL_OK } from '@/lib/gsap';

/**
 * Hero — the masthead over the shaft.
 *
 * The film itself is no longer here. It moved to FilmBackdrop, a fixed layer
 * behind the whole page, so the shaft now runs unbroken from the masthead to
 * the footer instead of ending when this section does. What is left here is
 * the choreography that belongs to the hero specifically: the pin, the copy
 * clearing out of the way, the travel rail, and the captions naming each part
 * of the machine as the camera passes it.
 *
 * This section is transparent on purpose. It used to carry `bg-ground`, an
 * opaque navy fill, which would now hide the very thing it is sitting on. The
 * scrims stay — they are what keeps the headline crisp over line-work.
 *
 * The pin still matters even with the film hoisted out: it is what buys the
 * ride its scroll distance, and FilmBackdrop measures this pin to decide how
 * much of the film to spend before the page starts.
 */

/**
 * How the pin is divided.
 *
 * The ride is done at 70%, which leaves nearly a third of the pin still to
 * scroll after the last of it lands. 70–80% holds clean, and the final fifth
 * is where FilmBackdrop settles the film back to a backdrop and brings up the
 * veil, so the copy below never has to hold contrast against moving line-work.
 */
const FILM_END = 0.7;
const SETTLE_AT = 0.8;

/** Captions, timed against the film so each lands as its part of the machine passes. */
const CHAPTER_WINDOWS: Array<[number, number]> = [
  [0.26, 0.39],
  [0.41, 0.54],
  [0.55, 0.67],
  [0.69, 0.84],   // the head — arrives on the last frame and reads through the hold
];

const line = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

const CHAPTERS = [
  { label: 'Pit', body: 'Buffers and the foot of the guide rails.' },
  { label: 'Travel', body: 'The car runs on guides the full height of the shaft.' },
  {
    label: 'Counterweight',
    body: 'It falls as the car rises, so the motor only moves the difference.',
  },
  { label: 'Head', body: 'Gearless traction machine and sheave, at the top of the shaft.' },
];

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useGsap(({ mm }) => {
    /**
     * One ride, two sizes. `end` is how much scroll the pin is worth, and
     * `rail` whether the travel rail exists at this width. Captions run at
     * every width — they are the reason the pin is worth its length.
     */
    const ride = (opts: { end: string; scrub: number; rail: boolean }) => () => {
      const q = gsap.utils.selector(root);
      const copy = root.current?.querySelector<HTMLElement>('[data-hero-copy]');

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: opts.end,
          scrub: opts.scrub,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
        },
      });

      // the spine: an inert tween that gives the timeline a duration of 1, so
      // every position below reads as a fraction of the pin
      tl.to({}, { duration: 1 });

      // the copy clears out of the way first
      if (copy) {
        tl.fromTo(copy, { y: 0, opacity: 1 }, { y: -70, opacity: 0, ease: 'none', duration: 0.28 }, 0);
      }

      // the invitation to scroll goes as soon as you take it
      tl.to(q('[data-hero-cue]'), { opacity: 0, y: 12, ease: 'none', duration: 0.06 }, 0);

      if (opts.rail) {
        // the travel rail fills as the car climbs, and leaves as it settles
        tl.fromTo(q('[data-hero-fill]'), { scaleY: 0 }, { scaleY: 1, ease: 'none', duration: FILM_END }, 0);
        tl.fromTo(q('[data-hero-rail]'), { opacity: 0 }, { opacity: 1, ease: 'none', duration: 0.06 }, 0.06);
        tl.to(q('[data-hero-rail]'), { opacity: 0, ease: 'none', duration: 0.06 }, SETTLE_AT);
      }

      // captions ride with the car — each one arrives as its part of the
      // machine passes, and leaves before the next
      q('[data-hero-chapter]').forEach((el, i) => {
        const [inAt, outAt] = CHAPTER_WINDOWS[i] ?? [0, 0];
        tl.fromTo(el, { opacity: 0, y: 14 }, { opacity: 1, y: 0, ease: 'none', duration: 0.05 }, inAt);
        tl.to(el, { opacity: 0, y: -14, ease: 'none', duration: 0.05 }, outAt);
      });

      ScrollTrigger.refresh();

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    };

    /* ---- desktop: the long ride, with the instrumentation --------------- */
    mm.add(SCROLL_OK, ride({ end: '+=700%', scrub: 0.6, rail: true }));

    /**
     * ---- phones: the same ride, shorter and tighter ---------------------
     * Every screen of pin is a thumb-stroke, and seven of them is a chore. The
     * travel rail stays desktop-only, since it lives in the right gutter and a
     * phone has no gutter to spare, but the captions run here too.
     */
    mm.add(TOUCH_SCROLL_OK, ride({ end: '+=380%', scrub: 0.4, rail: false }));

    // Reduced motion matches neither branch: nothing pins and nothing moves.
  }, root);

  return (
    <section
      ref={root}
      /* Full-bleed: the hero owns the whole viewport, the glass header floats
         over it, and the film shows through from the fixed layer behind. The
         negative top margin cancels the padding <main> adds for every other
         section. */
      className="relative ml-[calc(50%-50vw)] -mt-[calc(var(--gutter)+56px)] w-screen"
      aria-label="Introduction"
    >
      <div className="relative flex h-[100svh] min-h-[620px] flex-col overflow-hidden">
        {/* scrim, so the headline stays crisp over the line-work */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[54%]
                     bg-gradient-to-b from-ground via-ground/70 to-transparent"
        />
        {/* and one at the foot, so the captions have something to sit on */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[26%]
                     bg-gradient-to-t from-ground/75 to-transparent"
        />

        {/* ---- instrumentation: only where there is room for it ------------- */}

        {/* travel rail — fills from the pit as the car climbs */}
        <div
          data-hero-rail
          aria-hidden="true"
          className="pointer-events-none absolute right-[var(--gutter)] top-1/2 hidden
                     -translate-y-1/2 flex-col items-center gap-3 opacity-0 md:flex"
        >
          <span className="text-util uppercase tracking-[0.14em] text-white/55 [writing-mode:vertical-rl]">
            Travel
          </span>
          <span className="relative block h-[26vh] w-px bg-white/15">
            <span
              data-hero-fill
              className="absolute inset-x-0 bottom-0 block h-full origin-bottom scale-y-0 bg-sky/70"
            />
          </span>
        </div>

        {/* Captions, arriving as their part of the machine passes. The fixed
            height reserves room for the tallest of them, so a two-line caption
            following a one-line caption does not shift the block. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-[6%] md:bottom-[9%]"
        >
          <div className="mx-auto w-full max-w-[var(--container-content)] px-7 md:px-[var(--gutter)]">
            <div className="relative h-[104px] max-w-[32ch] md:h-[92px] md:max-w-[40ch]">
              {CHAPTERS.map((c, i) => (
                <div key={c.label} data-hero-chapter className="absolute inset-x-0 top-0 opacity-0">
                  <span className="text-util uppercase tracking-[0.08em] text-green">
                    {String(i + 1).padStart(2, '0')} · {c.label}
                  </span>
                  <p className="mt-3 text-[1.0625rem] leading-[1.3] text-white/85 md:text-d4">
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* the invitation — on phones too, since the ride is theirs as well */}
        <div
          data-hero-cue
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center
                     gap-3 motion-reduce:!hidden"
        >
          <span className="text-util uppercase tracking-[0.14em] text-white/60">
            Scroll to ride
          </span>
          <span className="block h-8 w-px overflow-hidden bg-white/15">
            <span className="hero-cue-tick block h-3 w-px bg-white/70" />
          </span>
        </div>

        <motion.div
          data-hero-copy
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.09, delayChildren: 0.12 }}
          className="relative z-10 flex flex-col items-center px-7 pt-28 text-center md:px-12 md:pt-32 lg:pt-36"
        >
          <motion.div variants={line}>
            <Eyebrow onNavy>{COMPANY.since} · Hazmieh · Kinshasa</Eyebrow>
          </motion.div>

          {/* The logo is the hero. Sized off the viewport so it stays the
              largest thing on screen at any width, with the tagline as the
              supporting line beneath it. */}
          <motion.h1 variants={line} className="mt-9 w-full md:mt-11">
            <Logo
              tone="white"
              markTone="green"
              className="mx-auto h-[clamp(58px,17vw,252px)] w-auto"
            />
          </motion.h1>

          <motion.p
            variants={line}
            className="mt-9 max-w-[22ch] text-[1.5rem] leading-[1.15] tracking-[-0.02em]
                       text-white/85 md:mt-10 md:max-w-none md:text-[2.25rem] lg:text-[2.5rem]"
          >
            Vertical mobility for every kind of building.
          </motion.p>

          <motion.div variants={line} className="mt-11 flex flex-wrap items-center justify-center gap-3">
            <CTA href="/#contact" variant="primary" arrow>
              Get a quote
            </CTA>
            <CTA href="/#projects" variant="outline-white">
              See our work
            </CTA>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
