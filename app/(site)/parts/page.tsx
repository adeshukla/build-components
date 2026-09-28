import type { Metadata } from "next";
import Link from "next/link";
import { Catalogue } from "@/components/catalogue";
import { categories, inStock, parts } from "@/lib/parts";

export const metadata: Metadata = {
  title: "Parts catalogue",
  description:
    "Every part in the catalogue: search by name, by pattern or by what it does, filter by type, and open one to configure and export it.",
  alternates: { canonical: "/parts" },
  openGraph: { title: "Parts catalogue", url: "/parts", images: "/opengraph-image" },
};

/** Counted from the catalogue rather than typed in, so the page cannot go stale. */
const perCategory = categories.map((name) => ({
  name,
  count: inStock.filter((part) => part.category === name).length,
}));

export default async function PartsPage({ searchParams }: PageProps<"/parts">) {
  const asked = await searchParams;
  const query = typeof asked.q === "string" ? asked.q : "";
  const type = typeof asked.type === "string" ? asked.type : "All";

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-7xl px-4 py-[clamp(2.5rem,5vw,4rem)] sm:px-6">
        <p className="font-mono text-xs tracking-wide text-ink-muted uppercase">
          <Link href="/" className="underline-offset-2 hover:underline">
            Home
          </Link>
          <span aria-hidden="true"> / </span>
          <span>Catalogue</span>
        </p>

        <h1 className="mt-3 font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.92] font-bold uppercase">
          Parts catalogue
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-pretty text-ink-muted">
          {inStock.length} parts, each one tested as both a React + Tailwind file and plain HTML, CSS and
          JavaScript. Search it, narrow it by type, then open one to set it up and take it away.
        </p>

        {/* Counted, not claimed: the numbers come from the catalogue itself. */}
        <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-t border-rule pt-5 font-mono text-xs tracking-wide text-ink-muted">
          {perCategory.map((entry) => (
            <div key={entry.name}>
              <dt className="inline">{entry.name}</dt>
              <dd className="ml-2 inline font-display text-xl leading-none font-bold text-ink">{entry.count}</dd>
            </div>
          ))}
        </dl>

        <section aria-labelledby="catalogue-heading" className="mt-8">
          <h2 id="catalogue-heading" className="sr-only">
            Every part
          </h2>
          {/* Every match is listed here, and the search goes in the address bar so a list can be shared. */}
          <Catalogue parts={parts} showAll syncUrl initialQuery={query} initialFilter={type} />
        </section>
      </div>
    </main>
  );
}
