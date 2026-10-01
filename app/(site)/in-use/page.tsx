import type { Metadata } from "next";
import Link from "next/link";
import { InUse } from "@/components/in-use";

export const metadata: Metadata = {
  title: "The parts in use",
  description:
    "Three whole screens built out of the catalogue — a product page, a checkout and an admin screen — with an X-ray that names every part in them.",
  alternates: { canonical: "/in-use" },
  openGraph: { title: "The parts in use", url: "/in-use", images: "/opengraph-image" },
};

export default function InUsePage() {
  return (
    <main className="flex-1">
      <div className="page-wrap py-[clamp(2.5rem,5vw,4rem)]">
        <p className="font-mono text-xs tracking-wide text-ink-muted uppercase">
          <Link href="/" className="underline underline-offset-2 hover:text-ink">
            Home
          </Link>
          <span aria-hidden="true"> / </span>
          <span>In use</span>
        </p>

        <h1 className="mt-3 max-w-4xl font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-[1]">
          What they look like together
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-pretty text-ink-muted">
          A part on its own page is easy to like. Here are three whole screens made of them, running for
          real — and a switch that draws a line round every part and tells you which one it is.
        </p>

        {/*
          The honest framing, and the reason the page is worth having: nothing below has been restyled to
          make the screens hang together. Each part is as it comes out of the catalogue.
        */}
        <p className="mt-4 max-w-2xl text-pretty text-ink-muted">
          Nothing here has been adjusted to fit. Every part is exactly what you would get by copying it
          out of the catalogue, with its own default content — which is also why the wording jumps about
          between them.
        </p>

        <section aria-labelledby="screens-heading" className="mt-10">
          <h2 id="screens-heading" className="sr-only">
            Screens built from the catalogue
          </h2>
          <InUse />
        </section>

        <aside className="mt-14 max-w-2xl rounded-xl border-l-4 border-accent bg-paper-sunk p-5">
          <h2 className="font-display text-xl">What this page is for</h2>
          <p className="mt-2 text-pretty text-ink-muted">
            Two things are easy to get wrong when you take parts from anywhere: they fight each other, and
            they turn out to be pictures rather than working components. Turn the X-ray on, tab through a
            screen, and you can check both in about a minute.
          </p>
          <p className="mt-3">
            <Link href="/parts" className="inline-flex min-h-6 items-center font-medium underline decoration-2 underline-offset-4">
              Browse all the parts
            </Link>
          </p>
        </aside>
      </div>
    </main>
  );
}
