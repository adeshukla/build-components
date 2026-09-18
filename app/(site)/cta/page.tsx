import type { Metadata } from "next";
import { PartHeader } from "@/components/part-header";
import { ctaSchema } from "@/registry/cta/schema";
import { parseConfig } from "@/lib/schema";
import { readComponentSources } from "@/lib/sources";
import { CtaEditor } from "./editor";

export const metadata: Metadata = { title: "CTA section: configure, test and export" };

export default async function CtaPage({ searchParams }: PageProps<"/cta">) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") query.set(key, value);
  }

  return (
    <main className="flex-1">
      <PartHeader slug="cta" />
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <CtaEditor initialConfig={parseConfig(ctaSchema, query)} sources={readComponentSources("cta")} />
      </div>
    </main>
  );
}
