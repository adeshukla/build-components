import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TemplatePreview } from "@/components/template-page";
import { optionsFromParams, templateById } from "@/lib/templates";

export const metadata: Metadata = { title: "Template preview", robots: { index: false } };

/** A template's React output on its own page, so the template editor can show it inside a frame. */
export default async function TemplatePreviewPage({ params, searchParams }: PageProps<"/preview-template/[id]">) {
  const { id } = await params;
  const template = templateById(id);
  if (!template) notFound();

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") query.set(key, value);
  }
  return <TemplatePreview id={id} initialOptions={optionsFromParams(template, query)} />;
}
