import type { Metadata } from "next";
import { PartHeader } from "@/components/part-header";
import { parseConfig } from "@/lib/schema";
import { readComponentSources } from "@/lib/sources";
import { headerSchema } from "@/registry/header/schema";
import { HeaderEditor } from "./editor";

export const metadata: Metadata = { title: "Site header: configure, test and export" };

export default async function HeaderPage({ searchParams }: PageProps<"/header">) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") query.set(key, value);
  }

  return (
    <main className="flex-1">
      <PartHeader slug="header" />
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <HeaderEditor initialConfig={parseConfig(headerSchema, query)} sources={readComponentSources("header")} />
      </div>
    </main>
  );
}
