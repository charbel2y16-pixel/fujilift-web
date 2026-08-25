import Image from 'next/image';
import Link from 'next/link';
import { CTA, Eyebrow, Reveal, SpecTable } from './ui';
import type { Spec } from '@/lib/data';

export type RelatedItem = { href: string; title: string; caption: string; image: string };

/**
 * Shared template for the Product Detail and Project Detail pages. Same
 * stacked-card system as the homepage, built around the spec-table card.
 */
export default function DetailPage({
  eyebrow,
  title,
  tagline,
  description,
  specs,
  hero,
  heroAlt,
  gallery = [],
  backHref,
  backLabel,
  related,
  relatedTitle,
  body,
}: {
  eyebrow: string;
  title: string;
  tagline: string;
  description: string;
  specs: readonly Spec[];
  hero: string;
  heroAlt: string;
  gallery?: Array<{ src: string; alt: string }>;
  backHref: string;
  backLabel: string;
  related: RelatedItem[];
  relatedTitle: string;
  body?: React.ReactNode;
}) {
  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <section className="shell">
        <div className="card card-surface">
          <div className="grid gap-10 px-7 pt-28 pb-10 md:px-12 md:pt-32 lg:grid-cols-[minmax(0,55fr)_minmax(0,45fr)] lg:gap-14 lg:px-14 lg:pb-14">
            <div>
              <Link
                href={backHref}
                className="inline-flex items-center gap-2 text-util uppercase tracking-[0.08em] text-white/50 transition-colors hover:text-white"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M9.5 6h-7M5.5 2.5 2 6l3.5 3.5" stroke="currentColor" strokeWidth="1.4"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {backLabel}
              </Link>

              <h1 className="mt-7 text-d2 text-white md:text-[3.25rem] md:leading-[1.06] md:tracking-[-0.03em]">
                {title}
              </h1>
              <p className="mt-6 max-w-[52ch] text-body text-white/65">{description}</p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <CTA href="/#contact" variant="primary" arrow>
                  Get a quote
                </CTA>
                <CTA href="/#maintenance" variant="outline-white">
                  Book a site survey
                </CTA>
              </div>
            </div>

            <div className="lg:pt-14">
              <Eyebrow onNavy>{eyebrow}</Eyebrow>
              <p className="mt-5 text-d4 text-white/90">{tagline}</p>
              <SpecTable specs={specs} onNavy className="mt-7" />
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- imagery */}
      <section className="shell">
        <Reveal className="card">
          <div className="photo relative aspect-[16/9] !rounded-card">
            <Image
              src={hero}
              alt={heroAlt}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </Reveal>
      </section>

      {gallery.length ? (
        <section className="shell">
          <div className="grid gap-[var(--rhythm)] md:grid-cols-2">
            {gallery.map((g) => (
              <Reveal key={g.src} className="card">
                <div className="photo relative aspect-[4/5] !rounded-card">
                  <Image src={g.src} alt={g.alt} fill sizes="(min-width:768px) 50vw, 100vw"
                    className="object-cover" />
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {body ? (
        <section className="shell">
          <div className="card card-surface">
            <div className="section-pad px-7 md:px-12 lg:px-14">{body}</div>
          </div>
        </section>
      ) : null}

      {/* --------------------------------------------------------- related */}
      <section className="shell">
        <div className="card card-surface">
          <div className="section-pad px-7 md:px-12 lg:px-14">
            <Eyebrow>{relatedTitle}</Eyebrow>
            <ul className="mt-9 grid gap-[var(--rhythm)] sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <li key={r.href}>
                  <Link href={r.href} className="group block">
                    <span className="photo relative block aspect-[4/5] overflow-hidden">
                      <Image
                        src={r.image}
                        alt=""
                        fill
                        sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </span>
                    <span className="mt-4 block text-d4 text-white">{r.title}</span>
                    <span className="mt-1 block text-sm text-white/55">{r.caption}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
