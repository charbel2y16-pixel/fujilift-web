import type { Metadata, Viewport } from 'next';
import { Inter, Inter_Tight } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SmoothScroll from '@/components/SmoothScroll';
import BuildingShaft from '@/components/BuildingShaft';
import FloorIndicator from '@/components/FloorIndicator';
import Cursor from '@/components/Cursor';
import RouteCurtain from '@/components/RouteCurtain';
import CardChoreo from '@/components/CardChoreo';
import { COMPANY } from '@/lib/data';
import './globals.css';

const display = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter-tight',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://fujilift.com'),
  title: {
    default: 'Fujilift — Vertical mobility for every kind of building',
    template: '%s — Fujilift',
  },
  description:
    'Elevators, escalators and moving walks designed, manufactured, installed and maintained from our own factory in Hazmieh, Lebanon, with a second office in Kinshasa.',
  openGraph: {
    type: 'website',
    siteName: 'Fujilift',
    locale: 'en',
    title: 'Fujilift — Vertical mobility for every kind of building',
    description:
      'Elevators, escalators and moving walks, engineered to EN 81-20 and built in Hazmieh since 1983.',
  },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = {
  themeColor: '#0E3145',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-[100]
                     focus:rounded-pill focus:bg-navy focus:px-6 focus:py-3 focus:text-white"
        >
          Skip to content
        </a>
        <SmoothScroll />
        <BuildingShaft />
        <Header />
        <main
          id="main"
          className="relative z-10 flex flex-col gap-[var(--rhythm)] pt-[calc(var(--gutter)+56px)]"
        >
          {children}
        </main>
        <Footer />
        <FloorIndicator />
        {/* Both are inert on touch and under reduced motion, and both sit
            outside <main> so nothing they do can create a containing block
            over the hero's pinned film. */}
        <Cursor />
        <RouteCurtain />
        <CardChoreo />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Fujilift',
              foundingDate: String(COMPANY.founded),
              email: COMPANY.email,
              telephone: COMPANY.lebanon.phone,
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'R. Maroun Bldg., Zhayma Street',
                addressLocality: 'Hazmieh',
                addressCountry: 'LB',
              },
              sameAs: Object.values(COMPANY.social),
            }),
          }}
        />
      </body>
    </html>
  );
}
