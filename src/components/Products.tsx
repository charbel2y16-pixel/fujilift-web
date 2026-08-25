import IndexList from './IndexList';
import { CTA, SectionHead } from './ui';
import { FEATURED_PRODUCTS, type Spec } from '@/lib/data';

/**
 * The two worth comparing across the range. It was three; a row has width for
 * two before the name starts losing ground, and capacity and speed are the two
 * anyone actually reads off a teaser. Travel height stays on the detail page.
 */
const pick = (specs: readonly Spec[], want: string[]) =>
  want.map((w) => specs.find((s) => s.label === w)).filter(Boolean) as Spec[];

const teaser = (specs: readonly Spec[]) => {
  const wanted = pick(specs, ['Capacity', 'Speed']);
  return wanted.length === 2 ? wanted : specs.slice(0, 2);
};

/**
 * Products — "Selected range". Four of the eleven lines as a 2x2 grid; the
 * rest are in the header mega-menu and on their own pages.
 */
export default function Products() {
  return (
    <section id="products" className="shell scroll-mt-28" aria-labelledby="products-title">
      <div className="card card-surface">
        <div className="section-pad px-7 md:px-12 lg:px-14">
          <SectionHead
            eyebrow="Selected range"
            title="Engineered for the building it lives in."
            titleId="products-title"
            sub="Eleven lines, from a 125 kg chairlift to a 3,500 kg car elevator."
            className="mx-auto max-w-[760px]"
          />

          <IndexList
            items={FEATURED_PRODUCTS.map((p) => ({
              href: `/products/${p.slug}`,
              eyebrow: p.tagline,
              title: p.featuredTitle ?? p.name,
              specs: teaser(p.specs),
            }))}
          />

          <div className="mt-12 flex justify-center">
            <CTA href="/products" variant="outline-navy">
              See the full range
            </CTA>
          </div>
        </div>
      </div>
    </section>
  );
}
