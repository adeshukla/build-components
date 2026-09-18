import type { Metadata } from "next";
import { PartHeader } from "@/components/part-header";
import { parseConfig } from "@/lib/schema";
import { readComponentSources } from "@/lib/sources";
import { searchableSelectSchema } from "@/registry/searchable-select/schema";
import { SearchableSelectEditor } from "./editor";

export const metadata: Metadata = { title: "Searchable select: configure, test and export" };

export default async function SearchableSelectPage({ searchParams }: PageProps<"/searchable-select">) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") query.set(key, value);
  }

  return (
    <main className="flex-1">
      <PartHeader slug="searchable-select" />
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <SearchableSelectEditor
          initialConfig={parseConfig(searchableSelectSchema, query)}
          sources={readComponentSources("searchable-select")}
        />
      </div>
    </main>
  );
}
