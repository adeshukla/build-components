import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TemplateEditor } from "@/components/template-editor";
import { partBySlug } from "@/lib/parts";
import { readTemplateSources } from "@/lib/sources";
import { templateById, templates } from "@/lib/templates";

export function generateStaticParams() {
  return templates.map((template) => ({ id: template.id }));
}

export async function generateMetadata({ params }: PageProps<"/templates/[id]">): Promise<Metadata> {
  const template = templateById((await params).id);
  if (!template) return {};
  return {
    title: `${template.name} template`,
    description: template.summary,
    alternates: { canonical: `/templates/${template.id}` },
  };
}

/** One template: set it up, check it as a page, take it home. */
export default async function TemplatePage({ params }: PageProps<"/templates/[id]">) {
  const { id } = await params;
  const template = templateById(id);
  if (!template) notFound();
  const { sources, exportNames } = readTemplateSources(template.sections.map((section) => section.slug));

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-7xl px-4 pt-8 sm:px-6">
        <p className="font-mono text-xs tracking-wide text-ink-muted uppercase">
          <Link href="/templates" className="underline underline-offset-2 hover:text-ink">
            Templates
          </Link>
          <span aria-hidden="true"> / </span>
          <span>{template.name}</span>
        </p>
        <h1 className="mt-3 font-display text-[clamp(2.5rem,6vw,4rem)] leading-[1]">{template.name}</h1>
        <p className="mt-3 max-w-2xl text-lg text-pretty text-ink-muted">{template.summary}</p>
        <p className="mt-3 flex flex-wrap gap-1.5">
          <span className="sr-only">Made of these parts:</span>
          {[...new Set(template.sections.map((section) => section.slug))].map((slug) => (
            <Link key={slug} href={`/${slug}`} className="glass inline-flex min-h-8 items-center rounded-full px-3 font-mono text-xs hover:border-accent">
              {partBySlug(slug).name}
            </Link>
          ))}
        </p>
      </div>
      <TemplateEditor id={template.id} sources={sources} exportNames={exportNames} />
    </main>
  );
}
