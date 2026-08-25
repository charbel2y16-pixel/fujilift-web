'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import Logo from './Logo';
import { CTA } from './ui';
import { NAV, PRODUCTS } from '@/lib/data';
import { menuTransition, EASE } from '@/lib/motion';

/** Mega-menu order, as specified in the brief. */
const MEGA_ORDER = [
  'passenger-elevators', 'hospital-bed-elevators', 'high-rise', 'mid-rise',
  'panoramic-elevator', 'vacuum-elevator', 'homelift', 'freight-elevators',
  'car-elevators', 'chairlifts', 'escalators',
];
const MEGA = MEGA_ORDER.map((s) => PRODUCTS.find((p) => p.slug === s)!).filter(Boolean);

export default function Header() {
  const [mega, setMega] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMega(false);
      setMobile(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobile ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobile]);

  const openMega = () => {
    window.clearTimeout(closeTimer.current);
    setMega(true);
  };
  const closeMega = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setMega(false), 120);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 pt-4 px-[var(--gutter)]">
      <div className="mx-auto w-full max-w-[var(--container-content)]" onMouseLeave={closeMega}>
        <div
          className={`glass relative flex items-center justify-between gap-6 rounded-pill
                      py-2 pl-5 pr-2 transition-[background,border-color] duration-300
                      ${scrolled ? 'glass--solid' : ''}`}
        >
          <Link href="/" aria-label="Fujilift — home" className="shrink-0 py-1">
            <Logo height={25} tone="navy" markTone="green-deep" />
          </Link>

          {/* ---- desktop nav ---- */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main">
            {NAV.map((item) =>
              item.mega ? (
                /* A link, not a toggle. A button here fought itself: the
                   pointer enters before the click lands, so hover opened the
                   menu and the click immediately closed it again. Hovering or
                   focusing opens it; activating goes to the full range. */
                <div key={item.label} onMouseEnter={openMega}>
                  <Link
                    href="/products"
                    aria-expanded={mega}
                    aria-haspopup="true"
                    onFocus={openMega}
                    className="link-sweep nav-sweep flex items-center gap-1.5 rounded-pill px-4 py-2 text-sm
                               text-navy transition-colors hover:text-navy/70"
                  >
                    {item.label}
                    <motion.svg
                      width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"
                      animate={{ rotate: mega ? 180 : 0 }}
                      transition={{ duration: 0.22, ease: EASE }}
                    >
                      <path d="M2 3.75 5 6.75l3-3" stroke="currentColor" strokeWidth="1.3"
                        strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                  </Link>
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  onMouseEnter={closeMega}
                  className="link-sweep nav-sweep rounded-pill px-4 py-2 text-sm text-navy transition-colors
                             hover:text-navy/70"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="flex items-center gap-2">
            <CTA href="/#contact" variant="primary" className="hidden sm:inline-flex !py-3 !px-6">
              Get a quote
            </CTA>
            <button
              type="button"
              onClick={() => setMobile(true)}
              aria-label="Open menu"
              className="lg:hidden grid h-11 w-11 place-items-center rounded-full text-navy"
            >
              <span className="sr-only">Menu</span>
              <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden="true">
                <path d="M0 1h18M0 6h18M0 11h18" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>

          {/* ---- mega-menu ---- */}
          <AnimatePresence>
            {mega ? (
              <motion.div
                key="mega"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={menuTransition}
                className="absolute left-0 right-0 top-[calc(100%+10px)] hidden overflow-hidden
                           rounded-card border border-hairline bg-white shadow-[var(--shadow-card)] lg:block on-light"
                onMouseEnter={openMega}
              >
                <div className="p-7">
                  <div className="flex items-baseline justify-between">
                    <span className="eyebrow eyebrow--on-light">Our products</span>
                    <Link href="/products" className="link-sweep text-sm text-slate transition-colors hover:text-green-deep">
                      All products
                    </Link>
                  </div>
                  <ul className="mt-6 grid grid-cols-4 gap-x-6 gap-y-1">
                    {MEGA.map((p, i) => (
                      <motion.li
                        key={p.slug}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.02 * i, duration: 0.25, ease: EASE }}
                      >
                        <Link
                          href={`/products/${p.slug}`}
                          onClick={() => setMega(false)}
                          className="group flex items-center gap-3 rounded-inner p-2 transition-colors hover:bg-paper"
                        >
                          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[8px] bg-paper">
                            <Image src={p.image} alt="" fill sizes="44px" className="object-cover" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm text-navy">{p.menu}</span>
                            <span className="block truncate text-util uppercase tracking-[0.08em] text-slate">
                              {p.tagline}
                            </span>
                          </span>
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* ---- mobile nav ---- */}
      <AnimatePresence>
        {mobile ? (
          <motion.div
            key="mobile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={menuTransition}
            className="fixed inset-0 z-50 bg-ground lg:hidden"
          >
            <div className="flex h-full flex-col p-[var(--gutter)]">
              <div className="flex items-center justify-between py-2">
                <Logo height={22} tone="navy" markTone="green-deep" />
                <button
                  type="button"
                  onClick={() => setMobile(false)}
                  aria-label="Close menu"
                  className="grid h-11 w-11 place-items-center rounded-full text-navy"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M1 1l14 14M15 1L1 15" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
              </div>

              <nav className="mt-8 flex-1 overflow-y-auto" aria-label="Mobile">
                <ul className="space-y-1">
                  {NAV.map((item, i) => (
                    <motion.li
                      key={item.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.03 * i, duration: 0.3, ease: EASE }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setMobile(false)}
                        className="block border-b border-[var(--color-edge)] py-4 text-d4 text-white"
                      >
                        {item.label}
                      </Link>
                    </motion.li>
                  ))}
                </ul>

                <p className="eyebrow mt-8">All products</p>
                <ul className="mt-4 grid grid-cols-2 gap-x-4">
                  {MEGA.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/products/${p.slug}`}
                        onClick={() => setMobile(false)}
                        className="block border-b border-[var(--color-edge)] py-3 text-sm text-white/60"
                      >
                        {p.menu}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="pt-6">
                <CTA href="/#contact" variant="primary" className="w-full">
                  Get a quote
                </CTA>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
