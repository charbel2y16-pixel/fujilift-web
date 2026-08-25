import IndexList from './IndexList';
import { SectionHead } from './ui';
import { PROJECTS, type Spec } from '@/lib/data';

/**
 * Building type and unit count. Completion used to be a third row, but the
 * card already carries it in the eyebrow — it was the same fact twice.
 */
const pick = (specs: readonly Spec[], want: string[]) =>
  want.map((w) => specs.find((s) => s.label === w)).filter(Boolean) as Spec[];

/**
 * Projects — the installed record, in the same grid as Products so the two
 * sections read as a pair: Platine Tower, Rabieh Villa, Iveco, Sodicar.
 */
export default function Projects() {
  return (
    <section id="projects" className="shell scroll-mt-28" aria-labelledby="projects-title">
      <div className="card card-surface">
        <div className="section-pad px-7 md:px-12 lg:px-14">
          <SectionHead
            eyebrow="Selected work"
            title="Buildings we already move people through."
            titleId="projects-title"
            sub="Specified, built and handed over by our own crews."
            className="mx-auto max-w-[760px]"
          />

          <IndexList
            items={PROJECTS.map((p) => ({
              href: `/projects/${p.slug}`,
              eyebrow: p.completion,
              title: p.name,
              caption: p.location,
              specs: pick(p.specs, ['Building type', 'Units installed']),
            }))}
          />
        </div>
      </div>
    </section>
  );
}
