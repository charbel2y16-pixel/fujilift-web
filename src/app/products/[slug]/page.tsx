import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import DetailPage from '@/components/DetailPage';
import { PRODUCTS, productBySlug } from '@/lib/data';

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/products/${product.slug}` },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) notFound();

  const related = PRODUCTS.filter((p) => p.slug !== product.slug)
    .slice(0, 3)
    .map((p) => ({
      href: `/products/${p.slug}`,
      title: p.name,
      caption: p.tagline,
      image: p.image,
    }));

  return (
    <DetailPage
      eyebrow="Specification"
      title={product.name}
      tagline={product.tagline}
      description={product.description}
      specs={product.specs}
      hero={product.wide ?? product.image}
      heroAlt={product.name}
      backHref="/#products"
      backLabel="All products"
      related={related}
      relatedTitle="Other products"
      body={
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <h2 className="text-d3 text-white md:text-d2 max-w-[16ch]">
            Specified against your drawings, not off a shelf.
          </h2>
          <div className="lede">
            <p>
              Every order starts with the shaft. We take your architect’s plans, run the traffic
              calculation, and come back with a cabin, door and drive specification that fits the
              opening you actually have — including the awkward ones in existing buildings.
            </p>
            <p className="mt-4">
              Cabins are finished in our Hazmieh factory, so interior materials, lighting and
              control panels are chosen rather than catalogued. Installation and commissioning are
              done by our own crews, and the same crews maintain the lift afterwards.
            </p>
          </div>
        </div>
      }
    />
  );
}
