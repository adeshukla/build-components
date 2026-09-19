import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PartEditor } from "@/components/part-editor";
import { PartHeader } from "@/components/part-header";
import { inStock } from "@/lib/parts";
import { isRegistrySlug, registry } from "@/lib/registry";
import { parseConfig } from "@/lib/schema";
import { readComponentSources } from "@/lib/sources";

/** One page for every part in the catalogue: the datasheet header, then the editor. */
export function generateStaticParams() {
  return inStock.map((part) => ({ slug: part.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (!isRegistrySlug(slug)) return {};
  return { title: `${registry[slug].title}: configure, test and export` };
}

export default async function PartPage({ params, searchParams }: PageProps<"/[slug]">) {
  const { slug } = await params;
  if (!isRegistrySlug(slug)) notFound();

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") query.set(key, value);
  }

  return (
    <main className="flex-1">
      <PartHeader slug={slug} />
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
        <PartEditor
          slug={slug}
          initialConfig={parseConfig(registry[slug].schema, query)}
          sources={readComponentSources(slug)}
        />
      </div>
    </main>
  );
}
