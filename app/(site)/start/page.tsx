import type { Metadata } from "next";
import Link from "next/link";
import { inStock } from "@/lib/parts";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Get started",
  description:
    "Two ways to take a part: copy the files, or install it by URL with the shadcn CLI. What you need in your project, what you do not, and what the code needs from you.",
  alternates: { canonical: "/start" },
  openGraph: { title: "Get started", url: "/start", images: "/opengraph-image" },
};

/** One shell block. Tagged so the page's own copy button has something to point at. */
function Command({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-lg border border-rule bg-board px-4 py-3 font-mono text-sm text-silk">
      <code>{children}</code>
    </pre>
  );
}

export default function StartPage() {
  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-7xl px-4 py-[clamp(2.5rem,5vw,4rem)] sm:px-6">
        <p className="font-mono text-xs tracking-wide text-ink-muted uppercase">
          <Link href="/" className="underline-offset-2 hover:underline">
            Home
          </Link>
          <span aria-hidden="true"> / </span>
          <span>Get started</span>
        </p>

        <h1 className="mt-3 max-w-4xl font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.92] font-bold uppercase">
          Take a part
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-pretty text-ink-muted">
          There is nothing to install from here. Every one of the {inStock.length} parts is a file you copy
          into your project, and after that it is yours — including the bits you disagree with.
        </p>

        <div className="mt-14 grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div className="grid gap-12">
            <section aria-labelledby="two-ways">
              <h2 id="two-ways" className="font-display text-4xl leading-none font-bold uppercase sm:text-5xl">
                Two ways in
              </h2>

              <h3 className="mt-8 font-display text-2xl font-semibold uppercase">1. Copy the files</h3>
              <p className="mt-2 max-w-prose text-pretty text-ink-muted">
                Open a part, set it up, and copy what the Code tab shows. For React that is one file. For
                the plain output it is an HTML fragment, a stylesheet and — only when the part needs one — a
                script. The code you copy is the code the tests ran against.
              </p>

              <h3 className="mt-8 font-display text-2xl font-semibold uppercase">2. Install it by URL</h3>
              <p className="mt-2 max-w-prose text-pretty text-ink-muted">
                Every part is also a shadcn registry item, so the CLI can fetch it. Your options travel in
                the query string, which means the command you copy sets the part up exactly as you left it.
              </p>
              <Command>{`npx shadcn@latest add ${siteUrl}/r/date-picker.json`}</Command>
              <p className="mt-3 max-w-prose text-sm text-pretty text-ink-muted">
                That is the plain default. The editor gives you the same command with your own options on
                the end — and the registry applies them to the file before it hands it over, so nothing has
                to be edited afterwards.
              </p>
            </section>

            <section aria-labelledby="needs">
              <h2 id="needs" className="font-display text-4xl leading-none font-bold uppercase sm:text-5xl">
                What your project needs
              </h2>
              <dl className="mt-6 grid gap-6">
                {[
                  [
                    "For the React output: React 19 and Tailwind CSS v4",
                    "The files use v4-only syntax — bg-(--dp-accent) rather than bg-[var(--dp-accent)] — and one or two use React 19's own stylesheet hoisting. On Tailwind v3 the classes will not compile.",
                  ],
                  [
                    "For the plain output: nothing at all",
                    "An HTML fragment, a stylesheet and sometimes a script. No build step, no framework, no package. Each stylesheet sets its own box-sizing and line-height, so it does not need a reset to look right.",
                  ],
                  [
                    "No runtime dependency, either way",
                    "Nothing here imports a component library. That is the point: there is no version of this to upgrade, and no maintainer to wait for.",
                  ],
                ].map(([term, detail]) => (
                  <div key={term} className="border-t border-rule pt-4">
                    <dt className="font-display text-xl font-semibold uppercase">{term}</dt>
                    <dd className="mt-2 max-w-prose text-pretty text-ink-muted">{detail}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section aria-labelledby="theming">
              <h2 id="theming" className="font-display text-4xl leading-none font-bold uppercase sm:text-5xl">
                Making it yours
              </h2>
              <p className="mt-3 max-w-prose text-pretty text-ink-muted">
                Every part draws its colours from custom properties set on its own root, prefixed per part
                — <code className="font-mono text-sm">--dp-</code> for the date picker,{" "}
                <code className="font-mono text-sm">--cmd-</code> for the command menu. Change them in one
                place and nothing else has to be touched.
              </p>
              <ul className="mt-5 grid list-disc gap-2 pl-5 text-pretty text-ink-muted">
                <li>
                  <strong className="font-semibold text-ink">Theme</strong> is an option on every part:
                  light, dark, or follow the device. &ldquo;Follow the device&rdquo; is the only one that
                  reacts to the operating system, so a page that is deliberately light stays light.
                </li>
                <li>
                  <strong className="font-semibold text-ink">An accent colour</strong> is corrected before
                  it is used as text, so a colour that would fail WCAG never gets printed.{" "}
                  <Link href="/tested" className="underline decoration-2 underline-offset-4">
                    Watch that happen
                  </Link>
                  .
                </li>
                <li>
                  <strong className="font-semibold text-ink">Money and dates</strong> are formatted by hand
                  rather than by locale, because <code className="font-mono text-sm">Intl</code> gives the
                  server and the browser different strings and breaks hydration. If you need real
                  localisation, that is the line to replace.
                </li>
              </ul>
            </section>

            <section aria-labelledby="licence">
              <h2 id="licence" className="font-display text-4xl leading-none font-bold uppercase sm:text-5xl">
                What you may do with it
              </h2>
              {/*
                Not decided yet, and saying so is better than implying a licence that does not exist.
                Replace this section with the licence once it is chosen.
              */}
              <p className="mt-3 max-w-prose text-pretty text-ink-muted">
                [TODO: no licence has been chosen for the exported code yet.] Until one is, treat this as
                undecided rather than permissive — ask first if you are putting it in something you ship.
              </p>
              <p className="mt-3">
                <Link href="/about" className="font-medium underline decoration-2 underline-offset-4">
                  How to ask
                </Link>
              </p>
            </section>
          </div>

          <aside className="grid content-start gap-8 rounded-xl border border-rule bg-paper-sunk p-6">
            <div>
              <h2 className="font-display text-xl font-semibold uppercase">Start with one of these</h2>
              <p className="mt-2 text-sm text-pretty text-ink-muted">
                Four parts that are hard to get right by hand, and where the difference shows quickly.
              </p>
              <ul className="mt-4 grid gap-2">
                {[
                  ["date-picker", "Date picker"],
                  ["command-menu", "Command menu"],
                  ["error-summary", "Form error summary"],
                  ["bottom-sheet", "Bottom sheet"],
                ].map(([slug, name]) => (
                  <li key={slug}>
                    <Link
                      href={`/${slug}`}
                      className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-rule bg-paper px-3 font-medium hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board"
                    >
                      {name}
                      <span aria-hidden="true" className="font-mono text-xs text-ink-muted">
                        {`/${slug}`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-rule pt-6">
              <h2 className="font-display text-xl font-semibold uppercase">Or read the tests first</h2>
              <p className="mt-2 text-sm text-pretty text-ink-muted">
                Every part page carries its keyboard map and a manual checklist. The checklist is the part
                a machine cannot check for you.
              </p>
              <p className="mt-4">
                <Link href="/tested" className="btn-ink">
                  How it is tested
                </Link>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
