import type { Metadata } from "next";
import { PartHeader } from "@/components/part-header";
import { megaMenuSchema } from "@/registry/mega-menu/schema";
import { parseConfig } from "@/lib/schema";
import { readComponentSources } from "@/lib/sources";
import { MegaMenuEditor } from "./editor";

export const metadata: Metadata = { title: "Mega menu: configure, test and export" };

export default async function MegaMenuPage({ searchParams }: PageProps<"/mega-menu">) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") query.set(key, value);
  }

  return (
    <main className="flex-1">
      <PartHeader slug="mega-menu" />
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <MegaMenuEditor
          initialConfig={parseConfig(megaMenuSchema, query)}
          sources={readComponentSources("mega-menu")}
        />
      </div>
    </main>
  );
}
