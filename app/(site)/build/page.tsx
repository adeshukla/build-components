import type { Metadata } from "next";
import { PageBuilder } from "@/components/page-builder";
import { registry } from "@/lib/registry";
import { readTemplateSources } from "@/lib/sources";

export const metadata: Metadata = {
  title: "Build a page",
  description: "Put a page together from accessible parts, set each one up, and take it home as a Next.js project or one HTML file.",
  alternates: { canonical: "/build" },
};

/** The page builder (D80). The page itself lives in the browser; this only hands over what the code view needs. */
export default function BuildPage() {
  const { exportNames } = readTemplateSources(Object.keys(registry));
  return (
    <main className="flex-1">
      <div className="page-wrap pt-[clamp(2.5rem,6vw,4.5rem)]">
        <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] leading-[1]">Build a page</h1>
        <p className="mt-3 max-w-2xl text-lg text-pretty text-ink-muted">
          Put parts from the catalogue in order, set each one up, and give the page your name, colour and theme. It
          stays in this browser; no account needed.
        </p>
      </div>
      <PageBuilder exportNames={exportNames} />
    </main>
  );
}
