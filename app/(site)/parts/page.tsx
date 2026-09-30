import type { Metadata } from "next";
import Link from "next/link";
import { Catalogue } from "@/components/catalogue";
import { inStock, parts } from "@/lib/parts";

export const metadata: Metadata = {
  title: "Parts catalogue",
  description:
    "Every part in the catalogue: search by name, by pattern or by what it does, filter by type, and open one to configure and export it.",
  alternates: { canonical: "/parts" },
  openGraph: { title: "Parts catalogue", url: "/parts", images: "/opengraph-image" },
};

export default async function PartsPage({ searchParams }: PageProps<"/parts">) {
  const asked = await searchParams;
  const query = typeof asked.q === "string" ? asked.q : "";
  const type = typeof asked.type === "string" ? asked.type : "All";
  const group = typeof asked.group === "string" ? asked.group : "All";

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-7xl px-4 py-[clamp(2.5rem,5vw,4rem)] sm:px-6">
        <p className="font-mono text-xs tracking-wide text-ink-muted uppercase">
          <Link href="/" className="underline underline-offset-2 hover:text-ink">
            Home
          </Link>
          <span aria-hidden="true"> / </span>
          <span>Catalogue</span>
        </p>

        <h1 className="mt-3 font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-[1]">
          Parts catalogue
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-pretty text-ink-muted">
          {inStock.length} parts, each one tested as both a React + Tailwind file and plain HTML, CSS and
          JavaScript. Search it, narrow it by type and group, then open one to set it up and take it away.
        </p>

        <section aria-labelledby="catalogue-heading" className="mt-8">
          <h2 id="catalogue-heading" className="sr-only">
            Every part
          </h2>
          {/* Every match is listed here, and the search goes in the address bar so a list can be shared. */}
          <Catalogue parts={parts} showAll syncUrl initialQuery={query} initialFilter={type} initialGroup={group} />
        </section>
      </div>
    </main>
  );
}
