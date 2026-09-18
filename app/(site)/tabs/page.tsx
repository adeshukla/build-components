import type { Metadata } from "next";
import { PartHeader } from "@/components/part-header";
import { tabsSchema } from "@/registry/tabs/schema";
import { parseConfig } from "@/lib/schema";
import { readComponentSources } from "@/lib/sources";
import { TabsEditor } from "./editor";

export const metadata: Metadata = { title: "Tabs: configure, test and export" };

export default async function TabsPage({ searchParams }: PageProps<"/tabs">) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") query.set(key, value);
  }

  return (
    <main className="flex-1">
      <PartHeader slug="tabs" />
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <TabsEditor initialConfig={parseConfig(tabsSchema, query)} sources={readComponentSources("tabs")} />
      </div>
    </main>
  );
}
