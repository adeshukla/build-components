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
      {/* Short, so the builder below gets the screen. */}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 pt-6 pb-4">
        <h1 className="font-display text-4xl leading-none">Build a page</h1>
        <p className="text-sm text-ink-muted">
          Drag parts onto the page, click one to set it up. It stays in this browser; no account needed.
        </p>
      </div>
      <PageBuilder exportNames={exportNames} />
    </main>
  );
}
