"use client";

import { Editor, type Sources } from "@/components/editor";
import { registry, type RegistrySlug } from "@/lib/registry";

/** The editor for any part: everything it needs comes from the one registry map. */
export function PartEditor({
  slug,
  initialConfig,
  sources,
}: {
  slug: RegistrySlug;
  initialConfig: Record<string, unknown>;
  sources: Sources;
}) {
  const part = registry[slug];
  return (
    <Editor
      slug={slug}
      schema={part.schema}
      initialConfig={initialConfig}
      sources={sources}
      keyboard={part.keyboard}
      checklist={part.checklist}
      vanillaHtml={"renderHtml" in part ? part.renderHtml : undefined}
    />
  );
}
