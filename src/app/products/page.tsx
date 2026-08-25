import type { Metadata } from 'next';
import ItemCard from '@/components/ItemCard';
import { SectionHead } from '@/components/ui';
import { PRODUCTS, type Spec } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Products',
  description:
    'Eleven lines of vertical transport — passenger, hospital bed, high-rise, mid-rise, panoramic, vacuum, home, freight, car, chairlifts, escalators.',
  alternates: { canonical: '/products' },
};

const pick = (specs: readonly Spec[], want: string[]) =>
  want.map((w) => specs.find((s) => s.label === w)).filter(Boolean) as Spec[];

/** The full range. The homepage shows four of these; this is all eleven. */
export default function ProductsIndex() {
  return (
    <section className="shell">
      <div className="card card-surface">
        <div className="px-7 pt-28 pb-[56px] md:px-12 md:pt-32 md:pb-[96px] lg:px-14 lg:pb-[120px]">
          <SectionHead
            as="h1"
            eyebrow="The full range"
            title="Eleven lines, one factory."
            sub="From a 125 kg chairlift to a 3,500 kg car elevator — all built, installed and maintained by us."
            className="mx-auto max-w-[760px]"
          />

          <ul className="mt-14 grid gap-x-[var(--rhythm)] gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-14 lg:gap-y-20">
            {PRODUCTS.map((p, i) => (
              <ItemCard
                key={p.slug}
                eyebrow={p.tagline}
                title={p.name}
                description={p.description}
                specs={
                  pick(p.specs, ['Capacity', 'Speed', 'Travel height']).length === 3
                    ? pick(p.specs, ['Capacity', 'Speed', 'Travel height'])
                    : p.specs.slice(0, 3)
                }
                image={p.image}
                alt={p.name}
                href={`/products/${p.slug}`}
                cta="View product"
                priority={i < 3}
              />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
