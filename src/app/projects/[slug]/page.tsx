import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import DetailPage from '@/components/DetailPage';
import { PROJECTS, projectBySlug } from '@/lib/data';

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const project = projectBySlug(slug);
  if (!project) return {};
  return {
    title: `${project.name} — ${project.location}`,
    description: project.description,
    alternates: { canonical: `/projects/${project.slug}` },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projectBySlug(slug);
  if (!project) notFound();

  const related = PROJECTS.filter((p) => p.slug !== project.slug).map((p) => ({
    href: `/projects/${p.slug}`,
    title: p.name,
    caption: `${p.location} · ${p.completion}`,
    image: p.image,
  }));

  const gallery = project.install
    ? [
        { src: project.image, alt: `${project.name}, ${project.location}` },
        { src: project.install, alt: `Fujilift installation at ${project.name}` },
      ]
    : [];

  return (
    <DetailPage
      eyebrow="Project details"
      title={project.name}
      tagline={project.buildingType}
      description={project.description}
      specs={project.specs}
      hero={project.wide ?? project.image}
      heroAlt={`${project.name}, ${project.location}`}
      gallery={gallery}
      backHref="/#projects"
      backLabel="All projects"
      related={related}
      relatedTitle="Other projects"
    />
  );
}
