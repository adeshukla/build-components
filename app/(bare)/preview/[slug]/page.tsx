import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PreviewClient } from "@/components/preview-client";
import { isRegistrySlug, registry } from "@/lib/registry";
import { parseConfig } from "@/lib/schema";

export const metadata: Metadata = { title: "Preview", robots: { index: false } };

/** The React output, rendered on its own page so the editor can show it inside a frame. */
export default async function PreviewPage({ params, searchParams }: PageProps<"/preview/[slug]">) {
  const { slug } = await params;
  if (!isRegistrySlug(slug)) notFound();

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") query.set(key, value);
  }

  return <PreviewClient slug={slug} initialConfig={parseConfig(registry[slug].schema, query)} demo={query.get("demo") === "1"} />;
}
