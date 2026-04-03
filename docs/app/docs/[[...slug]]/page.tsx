import { getPageImage, source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { gitConfig } from '@/lib/layout.shared';
import { BookText, Compass, Waypoints } from 'lucide-react';

const SECTION_LABELS: Record<string, string> = {
  contributing: 'Contributing',
  'core-concepts': 'Core Concepts',
  'getting-started': 'Getting Started',
  reference: 'Reference',
  research: 'Research',
};

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const section = params.slug?.[0];
  const sectionLabel = section ? SECTION_LABELS[section] ?? 'Documentation' : 'Overview';
  const headingCount = page.data.toc?.length ?? 0;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full} className="docs-page-shell">
      <section className="docs-page-lead not-prose">
        <div className="docs-page-lead__halo docs-page-lead__halo--one" />
        <div className="docs-page-lead__halo docs-page-lead__halo--two" />
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-fd-muted-foreground">
          <span className="docs-lead-pill">
            <Compass className="size-3.5" />
            {sectionLabel}
          </span>
          <span className="docs-lead-pill">
            <Waypoints className="size-3.5" />
            {headingCount} sections
          </span>
          <span className="docs-lead-pill">
            <BookText className="size-3.5" />
            {page.path}
          </span>
        </div>
        <DocsTitle className="mt-5">{page.data.title}</DocsTitle>
        <DocsDescription className="docs-page-lead__description">{page.data.description}</DocsDescription>
        <div className="mt-6 flex flex-row flex-wrap items-center gap-2">
          <MarkdownCopyButton markdownUrl={`${page.url}.mdx`} />
          <ViewOptionsPopover
            markdownUrl={`${page.url}.mdx`}
            githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/docs/content/docs/${page.path}`}
          />
        </div>
      </section>
      <div className="docs-divider" />
      <DocsBody className="docs-prose">
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
      <div className="docs-page-bottom-glow" aria-hidden />
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
