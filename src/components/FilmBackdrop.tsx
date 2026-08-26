'use client';

import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '@/lib/gsap';

/**
 * The film, behind the whole page.
 *
 * This used to live inside the hero and end with it. It is now a fixed layer
 * under everything, so the shaft runs unbroken from the masthead to the
 * footer — which is what the card system was always built for: `.card-surface`
 * is a border and not a fill precisely so nothing punches a hole in what is
 * behind it. BuildingShaft's rails and floor plates sit on the same plane.
 *
 * HOW SCROLL MAPS TO FRAMES. Not uniformly, and deliberately. The hero pin is
 * ~2,250px of an ~11,400px page. It takes HERO_SHARE of the frames — roughly
 * its share of the page, so the masthead is neither starved nor greedy — and
 * the rest spread across everything below it. The tail is coarse, a frame
 * every few hundred pixels, which would be unacceptable for a foreground and
 * is invisible at a backdrop's opacity behind a blur.
 *
 * The reward is that the last of the climb arrives as you reach the footer:
 * you ride up the shaft through the hero and are still arriving at the machine
 * room when you get to the bottom of the page.
 *
 * Frames are cross-faded rather than snapped to, and the painted position is
 * chased on rAF rather than driven straight off scroll — see paint() and
 * chase(). Between them, the frame count stops being something you can see.
 */

/** Two cuts of the same film — see the note on the alt grade below. */
type Seq = { count: number; dir: string };

/**
 * Which film rides. 'house' is the original 8s render; 'alt' is the Seedance
 * generation, 15s, which covers more of the shaft. Flip this one word.
 */
export const FILM: 'house' | 'alt' = 'alt';

const SEQ: { lg: Seq; sm: Seq } = {
  lg: FILM === 'alt' ? { count: 160, dir: 'seq-alt' } : { count: 128, dir: 'seq' },
  sm: { count: 96, dir: 'seq-sm' },
};

/**
 * One grade per film, because they are lit nothing like each other.
 *
 *                    ground luma   ground rgb
 *   house render          81.8     rgb(68,84,100)
 *   --color-ground        31.1     rgb(10,35,54)   <- what both must land on
 *   alt render            25.2     rgb(4,28,60)
 *
 * The house render is a light slate blue that has to be pulled a long way
 * down; the generated cut already sits a shade below the target, so the same
 * grade drives its ground to rgb(0,0,5) and takes everything up to the 95th
 * percentile of line-work with it. The alt values are solved, not guessed:
 * they map its ground to 31 luma and its 99th percentile to 81, which is where
 * the house grade lands those same landmarks.
 */
const GRADES = {
  house: 'contrast(1.78) brightness(0.68) saturate(1.15)',
  alt: 'contrast(0.97) brightness(1.1) saturate(0.85)',
} as const;

/**
 * Share of the film spent on the hero pin; the rest carries the page.
 *
 * This was 0.85, against a pin worth seven screens — so the film was all but
 * over before you reached a word of content, and the pin was most of the
 * scrolling on the site. The pin is now worth 2.5 screens and takes about a
 * fifth of the frames, which is roughly its share of the page. The ride reads
 * as an opening rather than the main event, and the climb genuinely unfolds
 * from the masthead to the footer instead of finishing in the first section.
 */
const HERO_SHARE = 0.3;
/** How far down the remaining scroll the climb has fully arrived. */
const TAIL_ARRIVES_BY = 0.92;
/** Where the film starts settling back to a backdrop. */
const SETTLE_AT = 0.8;
/**
 * How present the film is once it is behind reading content.
 *
 * ONE attenuation, not two. This originally faded the band to 0.16 AND laid a
 * veil at 0.82 over it, which multiplies: 0.16 x 0.18 leaves 2.9% of the film
 * reaching the screen. Measured, that came to 0.28 luma of visible structure
 * in one place and 0.00 in another — the film was not subtle, it was gone.
 *
 * So the band now always paints at full strength and the veil alone decides
 * how much of it survives. Presence is 1 - VEIL_MAX, and it is one number to
 * turn rather than two that fight.
 */
const VEIL_MAX = 0.68;
const BACKDROP_BLUR = 4;

const frameUrl = (seq: Seq, i: number) =>
  `/media/hero/${seq.dir}/f${String(i).padStart(3, '0')}.webp`;

/** Paints the still sequence into a canvas, cover-fitted and DPR-aware. */
function createFilm(canvas: HTMLCanvasElement, seq: Seq) {
  const FRAMES = seq.count;
  const ctx = canvas.getContext('2d');
  canvas.dataset.total = String(FRAMES);   // read by scripts/scrub-check.mjs
  const imgs: Array<HTMLImageElement | null> = new Array(FRAMES).fill(null);
  let current = -1;
  let disposed = false;

  const nearest = (i: number) => {
    if (imgs[i]) return i;
    for (let d = 1; d < FRAMES; d++) {
      if (i - d >= 0 && imgs[i - d]) return i - d;
      if (i + d < FRAMES && imgs[i + d]) return i + d;
    }
    return -1;
  };

  /** Cover-fit one frame over the whole canvas. */
  const drawCover = (img: HTMLImageElement, alpha: number) => {
    const cw = canvas.width, ch = canvas.height;
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx!.globalAlpha = alpha;
    ctx!.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    ctx!.globalAlpha = 1;
  };

  /**
   * Paint a FRACTIONAL frame by cross-fading the two it falls between.
   *
   * This is what makes a frame sequence read as motion rather than as a
   * slideshow. Snapping to the nearest frame means the film only changes once
   * every scroll-distance-per-frame — at 160 frames over an 11,000px page that
   * is one change per ~70px, which is plainly steppy no matter how smooth the
   * scrolling itself is. Blending the neighbour on top at the fractional part
   * makes the in-between positions real, so the shaft moves continuously and
   * the frame count stops being something you can see.
   *
   * It costs one extra drawImage, and only while the two differ.
   */
  const paint = (at: number, force = false) => {
    if (!ctx || disposed) return;
    if (!force && Math.abs(at - current) < 0.004) return;

    const lo = Math.floor(at);
    const frac = at - lo;
    const a = nearest(lo);
    if (a < 0) return;
    current = at;
    canvas.dataset.frame = String(Math.round(at));   // read by scripts/scrub-check.mjs

    drawCover(imgs[a]!, 1);
    if (frac > 0.01 && lo + 1 < FRAMES) {
      const b = nearest(lo + 1);
      // only blend a genuinely different frame — while the sequence is still
      // streaming, nearest() can hand back the one already painted
      if (b >= 0 && b !== a) drawCover(imgs[b]!, frac);
    }
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
  /** where the canvas actually is, chased toward `wanted` on rAF */
  let shown = 0;
  let raf = 0;
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
      paint(shown, true);   // a newly arrived frame may beat what is showing
      pump();
    };
    img.src = frameUrl(seq, idx);
    if (img.decode) {
      img.decode().then(ready, () => (img.complete && img.naturalWidth ? ready() : pump()));
    } else {
      img.onload = ready;
      img.onerror = pump;
    }
  };
  for (let k = 0; k < 4; k++) pump();

  window.addEventListener('resize', resize);

  /**
   * Ease the painted position toward the wanted one on its own rAF.
   *
   * Scroll arrives in lumps — a wheel notch, a trackpad flick, a touch move —
   * and painting straight from it inherits that lumpiness even with the frames
   * blended. Chasing the target on a frame loop turns each lump into a short
   * glide, and because it runs on rAF the film keeps moving between scroll
   * events instead of only when one lands.
   *
   * The loop stops itself once it arrives, so a still page costs nothing.
   */
  const chase = () => {
    raf = 0;
    if (disposed) return;
    const gap = wanted - shown;
    if (Math.abs(gap) < 0.01) {
      shown = wanted;
      paint(shown);
      return;
    }
    shown += gap * 0.22;
    paint(shown);
    raf = requestAnimationFrame(chase);
  };

  return {
    /** progress 0..1 */
    seek(t: number) {
      wanted = Math.max(0, Math.min(FRAMES - 1, t * (FRAMES - 1)));
      if (!raf) raf = requestAnimationFrame(chase);
    },
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    },
  };
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export default function FilmBackdrop() {
  const band = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const veil = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = canvas.current;
    if (!el) return;

    const touch = !window.matchMedia('(min-width: 768px)').matches;
    const film = createFilm(el, touch ? SEQ.sm : SEQ.lg);

    /**
     * Where the hero pin lets go, in document coordinates. GSAP wraps a pinned
     * element in a .pin-spacer whose height carries the pin distance, so this
     * is measured rather than assumed — the pin length is a number the hero
     * owns and is free to change.
     */
    let heroEnd = 0;
    let docMax = 1;
    let hasHero = false;
    const measure = () => {
      const hero = document.querySelector<HTMLElement>('section[aria-label="Introduction"]');
      hasHero = !!hero;
      const spacer = (hero?.closest('.pin-spacer') as HTMLElement | null) ?? hero;
      heroEnd = spacer
        ? Math.max(1, spacer.offsetTop + spacer.offsetHeight - window.innerHeight)
        : 1;
      docMax = Math.max(1, document.body.scrollHeight - window.innerHeight);
    };

    let raf = 0;
    const tick = () => {
      raf = 0;
      const y = window.scrollY;

      // ---- which frame ------------------------------------------------
      // hero pin: the ride, at full density. below it: the remainder,
      // stretched over the rest of the page.
      let t;
      if (!hasHero) {
        /**
         * No masthead to ride. The products index and the detail pages have
         * no hero, so there is no pin to measure and nothing to settle FROM —
         * left to the branch below they sat at full presence for their whole
         * length, which is both louder than these pages want and the one
         * place body copy would be laid straight over bright line-work.
         * Here the film is only ever a backdrop: alive across the page, but
         * settled from the first pixel.
         */
        t = clamp01(y / docMax);
      } else if (y <= heroEnd) {
        /**
         * Linear across the whole pin, with no hold at the end. This used to
         * finish the hero's share at 70% of the pin and sit still for the
         * remaining 30% — invisible when the pin was seven screens, but at two
         * and a half it is a dead stop right where the ride should be handing
         * off to the page. Ending exactly on HERO_SHARE means the tail picks
         * up from the same value and the two read as one move.
         */
        t = clamp01(y / heroEnd) * HERO_SHARE;
      } else {
        // Land the last frame a little before the true bottom. Mapping the
        // tail onto the full remaining scroll means the climb only completes
        // on the final pixel of the document, so the machine room never quite
        // arrives — you reach the footer still on the second-to-last frame.
        const runway = Math.max(1, (docMax - heroEnd) * TAIL_ARRIVES_BY);
        t = HERO_SHARE + clamp01((y - heroEnd) / runway) * (1 - HERO_SHARE);
      }
      film.seek(t);

      // ---- how present ------------------------------------------------
      // full through the hero, then settling to a backdrop as the pin ends
      const heroT = clamp01(y / heroEnd);
      const settle = hasHero ? clamp01((heroT - SETTLE_AT) / (1 - SETTLE_AT)) : 1;
      const eased = settle * settle;   // hold presence, then let go
      const blur = BACKDROP_BLUR * eased;
      const scale = 1 + 0.07 * clamp01(heroT / SETTLE_AT) + 0.07 * eased;

      // The band always paints at full strength — see VEIL_MAX. Only the blur
      // and the push-in are choreographed here.
      if (band.current) {
        band.current.style.filter = `${GRADES[FILM]} blur(${blur.toFixed(1)}px)`;
        band.current.style.transform = `scale(${scale.toFixed(3)})`;
      }
      // The veil is the single control over how much film survives behind the
      // reading content, so text never has to hold contrast against bright
      // moving line-work.
      if (veil.current) veil.current.style.opacity = String(VEIL_MAX * eased);
    };

    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const onResize = () => { measure(); onScroll(); };

    measure();
    tick();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    // the pin spacer only exists once ScrollTrigger has built it
    const settleIn = window.setTimeout(onResize, 1200);

    return () => {
      window.clearTimeout(settleIn);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
      film.dispose();
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        ref={band}
        data-hero-film
        className="absolute inset-0 will-change-[transform,filter,opacity]"
        style={{ filter: GRADES[FILM] }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/hero/hero-poster.webp"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <canvas
          ref={canvas}
          className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500"
        />
      </div>

      {/* pulls the film's ground the rest of the way onto brand navy */}
      <div className="absolute inset-0 bg-ground/26" />

      {/* and the veil that arrives once content starts scrolling over it —
          the single control over the film's presence, read by scrub-check */}
      <div ref={veil} data-hero-veil className="absolute inset-0 bg-ground opacity-0" />
    </div>
  );
}
