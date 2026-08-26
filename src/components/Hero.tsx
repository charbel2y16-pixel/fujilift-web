'use client';

import { Fragment, useRef } from 'react';
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
 * The pin is worth 2.5 screens now rather than seven. The film no longer
 * finishes inside it — it takes about a fifth of the frames here and the rest
 * unfold across the page below. FILM_END is what the travel rail fills to;
 * SETTLE_AT is where FilmBackdrop brings the veil up, so the copy below never
 * has to hold contrast against moving line-work.
 */
const FILM_END = 0.7;
const SETTLE_AT = 0.8;

/**
 * Captions, timed against the film so each lands as its part of the machine
 * passes. They span nearly the whole pin now: the pin is a fraction of what it
 * was, and on the old windows four captions inside 0.26-0.84 of it would have
 * flashed past faster than they can be read.
 */
const CHAPTER_WINDOWS: Array<[number, number]> = [
  [0.20, 0.37],
  [0.39, 0.56],
  [0.58, 0.74],
  [0.76, 0.93],
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
].map((c) => ({ ...c, words: c.body.split(' ') }));

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

      /**
       * Captions ride with the car — each arrives as its part of the machine
       * passes, and leaves before the next.
       *
       * The line assembles itself a word at a time out of its own mask rather
       * than fading in as a block: every word sits in an overflow-hidden box
       * and swings up from under it, staggered. Same idea as Rise, rebuilt on
       * the GSAP timeline because these are scrubbed against scroll rather
       * than played on viewport entry — the two would fight over the same
       * elements if Rise were dropped in here.
       *
       * The stagger is deliberately short. It is scrubbed, so a long one would
       * mean the tail of the sentence is still arriving while you are already
       * reading the head of it.
       */
      q('[data-hero-chapter]').forEach((el, i) => {
        const [inAt, outAt] = CHAPTER_WINDOWS[i] ?? [0, 0];
        const label = el.querySelector('[data-cap-label]');
        const words = el.querySelectorAll('[data-cap-word]');

        tl.set(el, { opacity: 1 }, inAt);
        if (label) {
          tl.fromTo(label, { opacity: 0, y: 12 }, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.035 }, inAt);
        }
        /**
         * `amount`, not a per-word delay. A per-word stagger makes the cascade
         * as long as the sentence: at 0.010 each, a twelve-word caption ran
         * 0.21 of the pin against a window only 0.17 wide, so its last words
         * were still climbing out of their masks when the caption began to
         * leave — permanently half-clipped. `amount` spreads a fixed total
         * across however many words there are, so every caption lands in the
         * same time and the longest one still finishes well inside its window.
         */
        tl.fromTo(
          words,
          { yPercent: 118 },
          { yPercent: 0, ease: 'power3.out', duration: 0.045, stagger: { amount: 0.035 } },
          inAt + 0.010,
        );
        // out as one piece — a staggered exit reads as hesitation
        tl.to(el, { opacity: 0, y: -22, ease: 'power2.in', duration: 0.05 }, outAt);
        tl.set(el, { y: 0 }, outAt + 0.05);
      });

      ScrollTrigger.refresh();

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    };

    /* ---- desktop: the long ride, with the instrumentation --------------- */
    mm.add(SCROLL_OK, ride({ end: '+=250%', scrub: 0.6, rail: true }));

    /**
     * ---- phones: the same ride, shorter and tighter ---------------------
     * Every screen of pin is a thumb-stroke, so a phone gets fewer. The
     * travel rail stays desktop-only, since it lives in the right gutter and a
     * phone has no gutter to spare, but the captions run here too.
     */
    mm.add(TOUCH_SCROLL_OK, ride({ end: '+=200%', scrub: 0.4, rail: false }));

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
        {/* And one at the foot, so the captions have something to sit on.
            It is a band rather than a ramp — see .hero-foot-scrim. Anchored at
            the bottom edge it was strongest exactly where the hero ends, and
            since the film behind the page is one fixed layer that is identical
            either side of that edge, the scrim stopping dead there read as a
            horizontal seam between the hero and the section below it. */}
        <div
          aria-hidden="true"
          className="hero-foot-scrim pointer-events-none absolute inset-x-0 bottom-0 h-[62%]"
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

        {/* Captions, arriving as their part of the machine passes.
            Centred and set large — they are the argument the pin exists to
            make, so they read as titles over the film rather than as a
            footnote in the corner. The fixed height reserves room for the
            tallest of them, so a three-line caption following a one-line
            caption does not shift the block. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-[13%] md:bottom-[15%]"
        >
          <div className="mx-auto w-full max-w-[var(--container-content)] px-7 md:px-[var(--gutter)]">
            <div className="relative mx-auto h-[164px] max-w-[26ch] text-center
                            md:h-[176px] md:max-w-[34ch]">
              {CHAPTERS.map((c, i) => (
                <div key={c.label} data-hero-chapter className="absolute inset-x-0 top-0 opacity-0">
                  <span
                    data-cap-label
                    className="text-util uppercase tracking-[0.24em] text-green"
                  >
                    {String(i + 1).padStart(2, '0')} · {c.label}
                  </span>
                  {/* Each word gets its own mask to rise out of. The box is
                      extended a fraction of an em downward and pulled back by
                      the same amount in margin, so descenders have somewhere
                      to be without the line gaining height. */}
                  <p className="mt-5 text-balance text-[1.45rem] leading-[1.25] tracking-[-0.02em]
                                text-white md:mt-6 md:text-d3 md:leading-[1.2] lg:text-[2.5rem]">
                    {c.words.map((word, wi) => (
                      <Fragment key={`${word}-${wi}`}>
                        <span className="inline-block overflow-hidden align-bottom pb-[0.13em] -mb-[0.13em]">
                          <span data-cap-word className="inline-block">{word}</span>
                        </span>
                        {/* the space is a sibling of the mask, never inside it —
                            inside, it is clipped and every word runs together */}
                        {wi < c.words.length - 1 ? ' ' : null}
                      </Fragment>
                    ))}
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
