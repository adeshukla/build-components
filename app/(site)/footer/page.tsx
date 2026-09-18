import type { Metadata } from "next";
import { PartHeader } from "@/components/part-header";
import { footerSchema } from "@/registry/footer/schema";
import { parseConfig } from "@/lib/schema";
import { readComponentSources } from "@/lib/sources";
import { FooterEditor } from "./editor";

export const metadata: Metadata = { title: "Site footer: configure, test and export" };

export default async function FooterPage({ searchParams }: PageProps<"/footer">) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") query.set(key, value);
  }

  return (
    <main className="flex-1">
      <PartHeader slug="footer" />
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <FooterEditor initialConfig={parseConfig(footerSchema, query)} sources={readComponentSources("footer")} />
      </div>
    </main>
  );
}
