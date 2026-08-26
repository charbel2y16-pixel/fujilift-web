'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import Logo from './Logo';
import { CTA, Eyebrow } from './ui';
import { COMPANY } from '@/lib/data';
import { EASE } from '@/lib/motion';
import { gsap, ScrollTrigger, useGsap, SCROLL_OK, TOUCH_SCROLL_OK } from '@/lib/gsap';

/**
 * Hero — full-bleed navy carrying Fujilift's wireframe elevator film.
 *
 * The section pins and the film is scrubbed against scroll position rather than
 * played on a clock: the car rises exactly as fast as you scroll and stops when
 * you stop. Phones do the same thing now, on a lighter cut of the same film.
 *
 * WHY A CANVAS AND NOT THE VIDEO. The source MP4 carries a single keyframe
 * across all 192 frames, so every seek makes the decoder replay from frame 1 —
 * scrubbing it freezes solid. Stills have no seek cost, so the scrubber paints
 * a pre-decoded sequence (scripts/video-sequence.mjs) into a canvas. That is
 * also why the phone used to just autoplay the MP4 on a loop: it could not be
 * scrubbed at all, so it was never tied to scroll.
 *
 * Two layers, each enhancing the one below:
 *   poster <img>   always painted — the no-JS and reduced-motion state
 *   <canvas>       scrubbed, everywhere motion is allowed
 *
 * The render's ground is slate blue (#475869), not brand navy; a shared
 * contrast/brightness grade lands it on navy while leaving the line-work
 * bright, which a navy overlay alone cannot do — that darkens the lines too.
 */

/**
 * Two cuts of the same film. Desktop paints the 1400px sequence; phones get a
 * 900px cut — 2.1 MB against the 8.9 MB the MP4 used to cost.
 *
 * WHY THESE COUNTS. The master is 8s at 24fps, so 192 distinct frames exist;
 * this used to take 96 of them and throw the rest away. The ride is now worth
 * roughly twice the scroll it was, and frame density is what stops a longer
 * pin reading as a slideshow — so desktop takes 128 and the phone 96, which
 * holds ~26 and ~36 frames per viewport of scroll respectively.
 *
 * Width came down from 1600 to 1400 to pay for it. Every frame is held as a
 * decoded bitmap while the ride is on screen, and 128 frames at 1600 would be
 * ~700 MB of them; at 1400 it is ~540 MB, which is what the 96-frame cut
 * already cost. More frames, same memory.
 */
const SEQ = {
  lg: { count: 128, dir: 'seq' },
  sm: { count: 96, dir: 'seq-sm' },
} as const;

type Seq = (typeof SEQ)[keyof typeof SEQ];

const frameUrl = (seq: Seq, i: number) =>
  `/media/hero/${seq.dir}/f${String(i).padStart(3, '0')}.webp`;

const GRADE = '[filter:contrast(1.78)_brightness(0.68)_saturate(1.15)]';

/**
 * How the pin is divided.
 *
 * The film is done at 70%, which leaves nearly a third of the pin still to
 * scroll after the last frame lands — the ride always finishes before anything
 * else can come into view. 70–80% holds that last frame clean, and the final
 * fifth dissolves it: blur up, scale on, opacity down to nothing. What is left
 * underneath is --color-ground, the same navy the next section sits on, so the
 * hero does not cut — it defocuses into the page.
 */
const FILM_END = 0.7;
const DISSOLVE_AT = 0.8;

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

/** Paints the still sequence into a canvas, cover-fitted and DPR-aware. */
function createFilm(canvas: HTMLCanvasElement, seq: Seq) {
  const FRAMES = seq.count;
  const ctx = canvas.getContext('2d');
  canvas.dataset.total = String(FRAMES);   // read by scripts/scrub-check.mjs
  const imgs: Array<HTMLImageElement | null> = new Array(FRAMES).fill(null);
  let current = -1;
  let disposed = false;

  const paint = (i: number, force = false) => {
    if (!ctx || disposed) return;
    const idx = nearest(i);
    if (idx < 0 || (!force && idx === current)) return;
    current = idx;
    canvas.dataset.frame = String(idx);   // read by scripts/scrub-check.mjs
    const img = imgs[idx]!;
    const cw = canvas.width, ch = canvas.height;
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  };

  /** Frames stream in; until the one you want lands, show the closest that has. */
  const nearest = (i: number) => {
    if (imgs[i]) return i;
    for (let d = 1; d < FRAMES; d++) {
      if (i - d >= 0 && imgs[i - d]) return i - d;
      if (i + d < FRAMES && imgs[i + d]) return i + d;
    }
    return -1;
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    if (current >= 0) paint(current, true);
  };

  let wanted = 0;
  let next = 0;
  const pump = () => {
    if (disposed || next >= FRAMES) return;
    const idx = next++;
    const img = new Image();
    img.decoding = 'async';

    const ready = () => {
      if (disposed) return;
      imgs[idx] = img;
      if (idx === 0) {
        resize();
        canvas.style.opacity = '1';
      }
      paint(wanted);          // a newly arrived frame may beat what is showing
      pump();
    };

    img.src = frameUrl(seq, idx);
    // decode() up front so drawImage never pays for one mid-scrub — that is
    // what an occasional 30ms paint spike is.
    if (img.decode) {
      img.decode().then(ready, () => (img.complete && img.naturalWidth ? ready() : pump()));
    } else {
      img.onload = ready;
      img.onerror = pump;
    }
  };
  // load in order, a few at a time, so early scroll positions are ready first
  for (let k = 0; k < 4; k++) pump();

  window.addEventListener('resize', resize);

  return {
    /** progress 0..1 */
    seek(t: number) {
      wanted = Math.max(0, Math.min(FRAMES - 1, Math.round(t * (FRAMES - 1))));
      paint(wanted);
    },
    dispose() {
      disposed = true;
      window.removeEventListener('resize', resize);
    },
  };
}

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useGsap(({ mm }) => {
    /**
     * One ride, two sizes. `seq` picks the cut of the film, `end` how much
     * scroll the pin is worth, and `rail` whether the travel rail exists at
     * this width. Captions run at every width — they are the reason the pin is
     * worth its length, so a phone that scrubbed the film in silence was
     * getting the ride without the explanation.
     */
    const ride = (opts: { seq: Seq; end: string; scrub: number; rail: boolean }) => () => {
      const el = canvas.current;
      if (!el) return;

      const film = createFilm(el, opts.seq);
      const q = gsap.utils.selector(root);
      const band = root.current?.querySelector<HTMLElement>('[data-hero-film]');
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

          /**
           * The film is driven from the trigger's own progress, not from the
           * scrubbed timeline. Scrub deliberately lags scroll by `scrub`
           * seconds, and on a hard flick that lag is enough to hand you a pin
           * release while the car is still halfway up the shaft. Reading
           * progress directly costs nothing — Lenis has already smoothed the
           * scroll underneath — and it makes the finish a fact rather than a
           * hope: at 70% of the pin the film is on its last frame, full stop.
           */
          onUpdate: (self) => film.seek(Math.min(1, self.progress / FILM_END)),
          onLeave: () => film.seek(1),
          onLeaveBack: () => film.seek(0),

          // blur and opacity are only worth a compositor layer while the ride
          // is actually on screen
          onToggle: (self) => {
            if (band) band.style.willChange = self.isActive ? 'transform, filter, opacity' : 'auto';
          },
        },
      });

      // A slow push-in, so the ride has depth rather than just vertical travel.
      // This is also the timeline's spine — every position below is a fraction
      // of these two tweens' combined duration of 1.
      tl.fromTo(
        q('[data-hero-film]'),
        { scale: 1 },
        { scale: 1.07, ease: 'none', duration: DISSOLVE_AT },
        0,
      );

      /**
       * The dissolve. Scale keeps running through it so the blur's soft edge is
       * pushed outside the section's clip instead of showing up as a grey rim,
       * and the ease holds the image present before letting go all at once.
       */
      tl.to(
        q('[data-hero-film]'),
        { scale: 1.14, ease: 'none', duration: 1 - DISSOLVE_AT },
        DISSOLVE_AT,
      );
      tl.fromTo(
        q('[data-hero-film]'),
        { filter: 'blur(0px)', opacity: 1 },
        { filter: 'blur(18px)', opacity: 0, ease: 'power2.in', duration: 1 - DISSOLVE_AT },
        DISSOLVE_AT,
      );

      // the copy clears out of the way first
      if (copy) {
        tl.fromTo(copy, { y: 0, opacity: 1 }, { y: -70, opacity: 0, ease: 'none', duration: 0.28 }, 0);
      }

      // the invitation to scroll goes as soon as you take it
      tl.to(q('[data-hero-cue]'), { opacity: 0, y: 12, ease: 'none', duration: 0.06 }, 0);

      if (opts.rail) {
        // the travel rail fills as the car climbs, and leaves as it dissolves
        tl.fromTo(q('[data-hero-fill]'), { scaleY: 0 }, { scaleY: 1, ease: 'none', duration: FILM_END }, 0);
        tl.fromTo(q('[data-hero-rail]'), { opacity: 0 }, { opacity: 1, ease: 'none', duration: 0.06 }, 0.06);
        tl.to(q('[data-hero-rail]'), { opacity: 0, ease: 'none', duration: 0.06 }, DISSOLVE_AT);
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
        film.dispose();
        tl.scrollTrigger?.kill();
        tl.kill();
        el.style.opacity = '0';
        if (band) band.style.willChange = 'auto';
      };
    };

    /* ---- desktop: the long ride, with the instrumentation --------------- */
    mm.add(SCROLL_OK, ride({ seq: SEQ.lg, end: '+=700%', scrub: 0.6, rail: true }));

    /**
     * ---- phones: the same ride, shorter and tighter ---------------------
     * A phone still gets a shorter pin than desktop's 700% — every screen of
     * pin is a thumb-stroke, and seven of them is a chore — and a shorter
     * scrub, because a touch flick moves faster than a wheel. The travel rail
     * stays desktop-only, since it lives in the right gutter and a phone has
     * no gutter to spare, but the captions run here too.
     */
    mm.add(TOUCH_SCROLL_OK, ride({ seq: SEQ.sm, end: '+=380%', scrub: 0.4, rail: false }));

    // Reduced motion matches neither branch: the poster stays and no frame is
    // ever fetched.
  }, root);

  return (
    <section
      ref={root}
      /* Full-bleed: the hero owns the whole viewport, the glass header floats
         over it, and the paper ground only starts below. The negative top
         margin cancels the padding <main> adds for every other section. */
      className="relative ml-[calc(50%-50vw)] -mt-[calc(var(--gutter)+56px)] w-screen"
      aria-label="Introduction"
    >
      <div className="relative flex h-[100svh] min-h-[620px] flex-col overflow-hidden bg-ground">
        {/* The film is 16:9. Cover-cropping is fine on a landscape viewport
            (~10% off the sides, and the shaft is centred), but on a 375x812
            phone it would show a quarter of the frame width and the car stops
            reading as a car — so below md it becomes its own uncropped band. */}
        <div
          data-hero-film
          aria-hidden="true"
          className="film-band pointer-events-none absolute inset-x-0 bottom-[10%] aspect-video w-full
                     md:inset-0 md:bottom-auto md:aspect-auto md:h-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/media/hero/hero-poster.webp"
            alt=""
            className={`absolute inset-0 h-full w-full object-cover ${GRADE}`}
          />
          <canvas
            ref={canvas}
            className={`absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500 ${GRADE}`}
          />
        </div>

        {/* pulls the film's ground the rest of the way onto brand navy */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-ground/26" />

        {/* scrim, so the headline stays crisp over the line-work */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[54%]
                     bg-gradient-to-b from-ground via-ground/70 to-transparent"
        />
        {/* And one at the foot, so the captions have something to sit on — at
            every width now that the captions run at every width. Kept at the
            desktop strength on purpose: on a phone the film band sits inside
            this scrim rather than behind it, so anything heavier reads the
            line-work off the screen entirely. */}
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

        {/* the invitation — on phones too, now that the ride is theirs as well */}
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
