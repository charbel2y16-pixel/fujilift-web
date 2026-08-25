import Hero from '@/components/Hero';
import About from '@/components/About';
import Studio from '@/components/Studio';
import Products from '@/components/Products';
import Projects from '@/components/Projects';
import LiftScroll from '@/components/LiftScroll';
import Partners from '@/components/Partners';
import Stats from '@/components/Stats';
import MaintenanceCTA from '@/components/MaintenanceCTA';

/**
 * Homepage — stacked cards on paper, in the order set out in the brief.
 * Every section is its own rounded card; the paper shows between them.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <LiftScroll />
      <About />
      <Studio />
      <Products />
      <Projects />
      <Partners />
      <Stats />
      <MaintenanceCTA />
    </>
  );
}
