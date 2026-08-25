# Fujilift — rebrand & website redesign

Full implementation of `fujilift-rebrand.md` for **Fujilift** (elevators, escalators and moving
walkways — Hazmieh, Lebanon + Kinshasa, DRC).

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion 12 ·
GSAP 3 + ScrollTrigger · Lenis

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # 20 static pages
npm run typecheck
```

---

## 1. Brand

The mark was **rebuilt parametrically**, not traced. `scripts/measure.mjs` and `scripts/scan.mjs`
read the original 1200px raster scanline by scanline; the construction turned out to be exact:

| Element | Construction |
|---|---|
| Capsule | Squircle-cornered, R = 238, Bézier handle ratio 0.616 (fuller than a circle — a plain 0.5523 circle misses the measured profile by ~12 units) |
| `fj` ligature | One bar, right edge x = 354, left edge stepping 157 → 247 → 157, elliptical terminals (rx 98.5, ry 61) |
| Wall slots | Crossbar breaks the right wall (y 199–293); hook breaks the left wall (y 792–869) |
| Chevrons | 3 up left (apex x 78), 3 down right (apex x 434), arms at 40.8°, pitch 85.25, stroke depth 39 |

Ratio comes out at **0.4808** — identical to the original lockup. Gradient and drop shadow are gone;
the mark is a single masked path that takes `currentColor`.

The **wordmark** is outlined from **Jost 700 + 300** — the closest geometric match to the original's
flat terminals and circular dots (Quicksand and Comfortaa were tested and rejected: both have
rounded terminals). Tracked to a 2.724 width/height ratio, matching the original exactly. The old
pipe divider between mark and wordmark is dropped.

```bash
node scripts/build-logo.mjs     # regenerates public/brand/*.svg + src/lib/logo.ts + src/app/icon.svg
```

Three lockups, per the brief: **full** (`<Logo />`), **mark only** (`<LogoMark />`, also the
favicon/app icon), **oversized wordmark** (`<LogoWordmark />`, the footer moment). Light and dark
variants of each in `public/brand/`.

## 2. Design tokens

`src/app/globals.css` — one `@theme` block, nothing hard-codes a hex.

The ground colour is **sampled off the rendered hero**, not guessed at —
`node scripts/sample-color.mjs <url>` reads the *modal* colour of the film's ground (an average
would be dragged well above it by the line-work) and reports it next to the surfaces used elsewhere.

It needed solving rather than reading, because the hero's own wash is drawn in this same colour: a
lighter value in the token tints the film, which moves the measurement, which moves the token. The
fixed point of `result = 0.74·film + 0.26·ground` is where the two are equal — **`#0A2336`**.
Measured back: hero `#0A2336`, card `#0A2336`, ground `#0A2337`.

Ground and surface are therefore the **same colour on purpose**. Cards are separated by a hairline
and their 24px radius, not by a change of value, so the film, the gaps and the cards all read as one
field.

| Token | Value | Role |
|---|---|---|
| `--color-ground` | `#0A2336` | Page ground — exactly the film's ground |
| `--color-surface` | `#0A2336` | Section cards — the same field, edged with `.card-surface` |
| `--color-surface-2` | `#0F2C40` | Genuinely nested panels only (stats, partner tiles) |
| `--color-edge` | `rgba(169,198,216,.16)` | Hairlines, sky-tinted |
| `--color-orange` | `#EE5C24` | Signal Orange, the only accent |
| `--color-sky` | `#A9C6D8` | Line-work — the hero film and the lift blueprint |
| `--color-paper` / `--color-slate` / `--color-hairline` | `#EFEEEB` / `#5C6E7A` / `#E4E3DF` | The light islands only (photo sub-cards, mega-menu) |
| `--radius-card` / `--radius-inner` | `24px` / `12px` | The stacked-card system |
| `--shadow-card` | `0 2px 12px rgba(14,49,69,.06)` | The heaviest shadow on the page |

Type: **Inter Tight** (display) + **Inter** (body) via `next/font`. Scale
`68 / 48 / 36 / 24 / 18 / 16 / 12` — one step up from the brief's `64/44/32/22/17/15/12`, on
request. Eyebrows stay 11px uppercase `0.08em`; tabular figures in every spec table. The whole
scale lives in `@theme`, so it moves as one thing.

## 3. Page structure

Every section below the hero is a **level**, numbered by the floor indicator (§4a).

1. **Hero** ★ — full-bleed, Fujilift's wireframe elevator film, pinned and scrubbed by scroll
2. **How a lift works** ★ (L01) — the scroll-scrubbed blueprint, explaining the machine you just rode
3. **About** (L02) — statement, EN 81-20 / ISO 9001 badges, Platine Tower install
4. **Factory** (L03) — Hazmieh floor + showroom, white sub-card
5. **Products** (L04) — 4 of the 11 lines as a 2×2 card grid, photo parallax
6. **Projects** (L05) — Platine Tower, Rabieh Villa, Iveco, Sodicar in the same grid
7. **Partners** (L06) — 12 marks tinted single-tone, Japan sub-card breaking the grid
8. **Track record** (L07) — darkened building photo, orange count-ups
9. **Maintenance** (L08) — orange card, replaces the current site's pop-up nag
10. **Footer** — contacts, link columns, socials, oversized orange wordmark rising on scroll

Detail templates: `/products/[slug]` (11 pages) and `/projects/[slug]` (4), both reusing the
spec-table card via `DetailPage.tsx`.

### Length

Products and Projects originally ran four full-width alternating photo/spec rows each — 3,476px and
3,341px on desktop, **40% of the page between them**, and over 1,000px *per product* on a phone.
`ItemCard.tsx` says the same thing as a 2×2 grid: photo, name, one line, three specs, link.

| | before | after |
|---|---|---|
| Desktop | 17,316px | **15,090px** (−13%) |
| Mobile | 18,343px | **13,078px** (−29%) |

The spec table survives in miniature — the three values worth comparing across a set — and is
hidden below `sm`, where twelve rows of small figures across four cards is noise rather than
information. The full table is on the detail page. The row parallax survives too, at ±18px, which
suits a grid better than the ±30px a full-width row wanted.

The hero pin is ~3,200px of what remains, by design (see §4). If the page still feels long, that is
the one number to change.

## 4. The hero film and the lift drawing

**Hero — `Hero.tsx`.** The **Fujilift lockup is the centrepiece** — orange mark, white wordmark,
sized off the viewport (`clamp(58px, 17vw, 252px)` tall) so it stays the largest thing on screen at
any width. The tagline sits beneath it at 2.5rem, then the two CTAs. It carries the `<h1>`, so the
heading is the brand and the tagline is a sibling paragraph rather than duplicated to screen
readers.

Behind all of it runs your wireframe elevator film (1920×1080, 8.00s). The section **pins for
`+=360%`** and the film is **scrubbed against scroll position** rather than played on a clock: the
car rises exactly as fast as you scroll and stops when you stop.

### It is a canvas, not a `<video>` — and that is not a preference

The source MP4 carries **exactly one keyframe across all 192 frames**. Every seek therefore makes
the decoder replay from frame 1, and it gets worse the deeper you scrub. Measured in Chrome:

| | per update | verdict |
|---|---|---|
| MP4 `currentTime` seek | avg **180ms**, worst **332ms** | 11–20 dropped frames — this is the freeze |
| Canvas paint of a decoded still | **< 0.01ms** | comfortably inside a 60fps budget |

The fix is either an all-keyframe re-encode (no ffmpeg on this machine) or to stop seeking
altogether. So `scripts/video-sequence.mjs` decodes the film **once** into 96 stills and the
scrubber just paints the right one:

```bash
node scripts/video-sequence.mjs http://localhost:3000/media/hero/hero.mp4 public/media/hero/seq 96 1600
node scripts/scrub-perf.mjs  http://localhost:3000    # seek cost vs paint cost
node scripts/scrub-check.mjs http://localhost:3000    # scroll -> frame mapping
```

96 frames at 1600px wide come to **5.7 MB** — lighter than the 8.9 MB video it replaces. Frames
stream in order so early scroll positions are ready first; until a frame lands the canvas shows the
nearest one it has, and each is `decode()`d before use so `drawImage` never pays for a decode
mid-scrub (that is what an occasional 30ms spike is).

Timeline durations are explicit, so the mapping is exactly linear. The film runs over the first
**82%** of the pin (~2,650px on a 900px screen) and the last frame then **holds** for the remaining
18%. That tail matters: `scrub` smoothing means the film lags the scrollbar, so without it the
closing second is still catching up as the section scrolls away and you never see the end of it.

### What happens during the ride

A long pin has to earn its length, so the scroll is scored rather than left as bare footage:

| Scroll | |
|---|---|
| 0% | **Scroll cue** — a tick falling down a hairline, the only thing moving before you scroll. Goes the moment you do, and is hidden entirely under reduced motion. |
| 0 – 28% | The headline block drifts up and clears. |
| 0 – 100% | A slow **push-in** (`scale 1 → 1.07`) so the ride has depth, not just vertical travel. |
| 6 – 94% | A **travel rail** down the right edge fills from the pit as the car climbs — the machine's own progress bar. |
| 30 / 48 / 65 / 81% | Four **captions** arrive as their part of the machine passes: Pit, Travel, Counterweight, Head. Each explains what is on screen, so the pin teaches instead of just holding. |

Everything animated here is `transform` or `opacity`.

Three layers, each enhancing the one below — and each context fetches only its own asset (verified):

| Context | Behaviour | Fetches |
|---|---|---|
| Desktop, motion allowed | Pinned, canvas scrubbed to scroll progress | 96 stills, 5.7 MB |
| Below 768px | Linear playback never seeks, so the MP4 is fine here — autoplays muted on a loop, `playsInline`. It also moves into its own **uncropped 16:9 band**: a cover crop on a 375×812 phone shows only ~26% of the frame width and the car stops reading as a car. Its top and bottom edges are masked so the band dissolves into the navy. | 1 MP4, 8.5 MB |
| Reduced motion | Holds the poster frame, never moves, no pin | poster only |

The render's ground is slate blue (`#475869`), not brand navy. A shared
`contrast(1.78) brightness(0.68) saturate(1.15)` plus a 26% navy wash lands it on `#1F3A4E` — in the
navy family, with the line-work still bright. A plain navy overlay cannot do this: it darkens the
lines by the same amount as the ground and they disappear.

`scripts/faststart.mjs` also moved the MP4's `moov` atom ahead of `mdat` (a hand-rolled remux, since
there is no ffmpeg here) so the mobile file starts without fetching its tail first.

The hand-built SVG cutaway that originally filled the hero is still in the repo
(`src/lib/drawing.ts`, `ArchDrawing.tsx`) but is no longer mounted — kept in case you want it back.
It is not imported, so it costs nothing in the bundle.

**Mid-page — `LiftScroll.tsx`.** The machine drawn flat, as a section: shaft, car,
counterweight, sheave, landings. Navy line-work on paper. The car rides up as the section scrolls
past. Hand-placed geometry — the point is that it is simple.

## 4a. The page as a building

The brief's premise is that elevators are architecture. Rather than leave that to the hero, the
whole page is built as one hoistway:

- **`BuildingShaft.tsx`** — a fixed layer behind everything: four guide rails, floor plates at a
  340px pitch, and bracket fixings where the two meet. The plates translate with scroll (`scrollY %
  pitch`, so the pattern is seamless and never needs to be longer than one bay), which reads as the
  building travelling past in the same direction the hero's car climbs. It is CSS gradients rather
  than SVG — the whole thing is one transform on two elements, so it costs nothing to move.
- **The cards are frames, not fills.** `.card-surface` is a hairline and a radius with a
  *transparent* background. An opaque card would cut a hole in the shaft behind it; leaving it
  transparent is what lets the structure run unbroken from the hero to the footer.
- **`FloorIndicator.tsx`** — a lift readout at the right edge. Each section is a level, the current
  one lights in orange, and the ticks are anchors, so it doubles as section navigation. It stays
  hidden until you have left the hero: while you are still in the film you are at the ground floor.

Rails sit in the **margins**, outside the 1240px column, and the floor plates are masked down to 18%
behind the reading column — the structure frames the page rather than striping across it. Both are
**large-screen only**: below `lg` the margins are too thin for the rails to sit beside the content
instead of through it, and a phone does not need the chrome.

## 5. Motion system

Framer Motion owns component state (reveals, staggers, hover/tap, mega-menu, mobile nav); GSAP owns
the scroll timeline. Nothing is animated by both. Lenis drives scrolling and feeds
`ScrollTrigger.update`, and is skipped entirely under reduced motion.

Every scroll effect is registered inside `gsap.matchMedia` gated on
`(min-width: 768px) and (prefers-reduced-motion: no-preference)`, inside a `gsap.context` that
reverts on unmount. `ScrollTrigger.refresh()` runs once fonts and images have settled.

- **`prefers-reduced-motion: reduce`** kills every scrub, loop, count-up, draw-on and the pin.
  The hero film holds its poster frame, the lift drawing renders fully drawn, content is in its
  final state. Verified in all three modes (desktop / mobile / reduced).
- The lift SVG ships **fully drawn** — JS only hides it to play the reveal, so no-JS lands correctly
  too, and the hero falls back to its poster image.
- Only `transform` and `opacity` are animated, with one deliberate exception: the draw-on animates
  `stroke-dashoffset`, which the brief explicitly requires ("build it, don't fake it"). It runs once.
- `will-change: transform` is set on parallax layers for the life of the scrub and removed after.

## 6. Assets

`assets/originals/` holds Fujilift's own photography, pulled at full resolution from the live site
(the `-thegem-portfolio-metro-large` suffix stripped to get originals). It is **outside** `public/`,
so it is archived but not served.

`scripts/process-images.mjs` re-crops to the new grid (4:5 for rows, 16:9 / 21:9 for feature bands),
applies one grade to everything, and writes WebP to `public/media/`. The grade uses per-channel
linear gain and offset — gain warms the highlights, offset lifts the shadows — plus ~10%
desaturation, so brick and concrete read against the navy.

Partner logos arrive as blue, red and yellow marks on white. `process-images.mjs` converts them to
**alpha silhouettes** (opacity from ink density *or* saturation, so a pale yellow mark reads as
strongly as a black wordmark); CSS then paints them single-tone navy at 40%, full navy on hover.
A plain CSS filter cannot do this.

Certification badges are redrawn as clean monochrome SVG (`CertBadge.tsx`) — the live site's are
171px rasters.

**Discarded from the live site:** `2025/03/7-1.jpg` and `2025/03/8.jpg`, which the brief lists as
feature imagery. Both are marketing graphics with large baked-in text ("2.5 AMP", "MOTOR BUILT WITH
A LIFETIME WARRANTY") in the old green brand colour — not photographs. Replaced with real frames
harvested from the `/pf/` product pages. Also discarded: the lorem-ipsum testimonial avatar.

## 7. Where this departs from the brief

Flagged rather than silently changed:

- **Hero.** The brief's hero was a 60/40 split card with a status list. On your direction it became
  full-bleed navy carrying your wireframe elevator film, pinned and scrubbed by scroll.
  The three-phase status list (`StatusList.tsx`) is built and working but is not currently placed —
  say the word and it goes back in, most naturally inside the About card.
- **The whole page is dark.** The brief called for a `--paper` ground with white cards. On request
  the film's palette now runs through the entire site: navy ground, `#17394D` cards, light type.
  White survives only as *islands* — the two photo sub-cards and the mega-menu — where it reads as a
  physical label rather than a surface. The Stats panel went from a white card to a translucent dark
  one, which suits orange numerals better anyway.
- **"35+ Years"** would be wrong: 1983 → today is 43. The stat counts from `COMPANY.founded` so it
  can never go stale.
- **"Platine Tower, Beirut"** — the real location is **Dbayeh** (from their own project page). Used
  the accurate one.
- **Stats eyebrow** is "Track record", not "Our practice", which the brief used twice on one page.
- **Header glass** uses inset highlights rather than a heavier drop shadow, so it stays inside the
  shadow ceiling the design system sets. Opacity is held at ~0.66 so navy nav labels keep AA
  contrast over the navy hero.

## 8. Before launch

- **Product spec values** (capacities, speeds, travel heights) in `src/lib/data.ts` are typical for
  each product class — the live site publishes no figures. Confirm against sales records. The
  **project** specs are real, taken from Fujilift's own project pages.
- `sales@fujilift.com` / `support@fujilift.com` were decoded from the site's Cloudflare-obfuscated
  mailto links — confirm they are the right inboxes.
- The contact CTAs anchor to the footer contact block; wire them to a real form or CRM.
- Hero payload is **5.7 MB of stills on desktop** and **8.5 MB of MP4 on mobile** — never both.
  If the mobile figure is a concern on Lebanese connections, re-encode at a lower bitrate or drop to
  720p; the poster covers the gap while it loads. Better still, **ask whoever produced the render
  for an all-keyframe export** (`-g 1`): that would let the mobile file be scrubbed too and would
  make the still sequence unnecessary. `video/Hero.mp4` is kept as the untouched master.
