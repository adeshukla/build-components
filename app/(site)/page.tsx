import Link from "next/link";
import { BoardTraces } from "@/components/board-traces";
import { Catalogue } from "@/components/catalogue";
import { StepDiagram } from "@/components/how-graphics";
import { MountedPart } from "@/components/mounted-part";
import { PartReel } from "@/components/part-reel";
import { inStock, parts } from "@/lib/parts";
import { DatePicker } from "@/registry/date-picker/react/date-picker";

const tests = [
  ["axe accessibility rules", "WCAG 2.0, 2.1 and 2.2, levels A and AA, with the component closed and open."],
  ["Keyboard only", "Open, move, pick and close without a mouse. Focus goes back where it came from."],
  ["Focus stays inside", "Tab and Shift+Tab wrap inside dialogs instead of escaping to the page behind."],
  ["Both outputs", "The same tests run on the React + Tailwind file and the HTML/CSS/JS files."],
  ["Browsers", "Chromium, WebKit (the Safari engine) and an emulated iPhone 15."],
  ["Install by URL", "The registry serves exactly the file you would copy, with your options applied."],
];

const steps = [
  {
    step: "configure" as const,
    title: "Configure",
    text: "Content, behaviour, add-ons and style, each in its own tab, with a search across every option and a gold dot on whatever you changed.",
  },
  {
    step: "test" as const,
    title: "Test",
    text: "Run the exported code, not a mock-up. Switch output and screen width, follow the keyboard map, tick off the manual checks.",
  },
  {
    step: "take" as const,
    title: "Take it home",
    text: "Copy the files, or install them with one shadcn command. The code is yours afterwards, with no library behind it.",
  },
];

export default function Home() {
  return (
    <main>
      {/* Hero: the board wires itself up and sets a real part down on it. */}
      <section aria-labelledby="hero-heading" className="on-board relative isolate overflow-hidden bg-board text-silk">
        <div aria-hidden="true" className="board-grid absolute inset-0 -z-20 opacity-50" />
        <BoardTraces />
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-[clamp(3.5rem,8vw,7rem)] sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div>
            <h1
              id="hero-heading"
              className="font-display text-[clamp(3rem,10vw,6rem)] leading-[0.88] font-bold tracking-[-0.02em] uppercase"
            >
              <span className="slab-line">Accessible parts.</span>
              <span className="slab-line text-pad" style={{ animationDelay: "140ms" }}>
                Plain code.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-pretty text-silk-muted sm:mt-8 sm:text-xl">
              Set a component up without writing code, test the exact files you will export, then take them into your
              project as React + Tailwind or HTML/CSS/JS. No library to install.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#catalogue" className="btn-pad">
                Open the catalogue
                <Arrow />
              </Link>
              <Link href="#try" className="btn-outline-board">
                Try four of them
              </Link>
            </div>
            {/* Counted from the catalogue, not typed in, so it cannot go stale. */}
            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-board-line pt-6 font-mono text-xs tracking-wide text-silk-muted">
              {[
                [inStock.length, "parts in stock"],
                [2, "outputs each"],
                [0, "runtime dependencies"],
              ].map(([value, term]) => (
                <div key={term as string}>
                  <dt className="sr-only">{term}</dt>
                  <dd>
                    <span className="mr-2 font-display text-3xl leading-none font-bold text-pad">{value}</span>
                    {term}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* One part, set down once: the arrival is the page's authored moment. */}
          <div className="mount-in" style={{ animationDelay: "280ms" }}>
            <MountedPart caption="Date picker · live, try it">
              <DatePicker />
            </MountedPart>
          </div>
        </div>
      </section>

      {/* The socket: four real parts, one at a time */}
      <section id="try" aria-labelledby="try-heading" className="on-board relative isolate scroll-mt-4 overflow-hidden bg-board-raised text-silk">
        <div aria-hidden="true" className="board-grid absolute inset-0 -z-20 opacity-30" />
        <div className="mx-auto w-full max-w-7xl px-4 py-[clamp(3.5rem,7vw,6rem)] sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6 border-b border-board-line pb-6">
            <h2 id="try-heading" className="font-display text-4xl leading-none font-bold uppercase sm:text-5xl lg:text-6xl">
              Try them here first
            </h2>
            <p className="max-w-md text-pretty text-silk-muted">
              These are the exported components, running. Use the keyboard on them — that is the part most libraries get
              wrong, and the part you can check before you commit to anything.
            </p>
          </div>
          <div className="mt-12">
            <PartReel />
          </div>
        </div>
      </section>

      {/* Catalogue */}
      <section id="catalogue" aria-labelledby="catalogue-heading" className="scroll-mt-4">
        <div className="mx-auto w-full max-w-7xl px-4 py-[clamp(3.5rem,7vw,6rem)] sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-5">
            <h2 id="catalogue-heading" className="font-display text-4xl leading-none font-bold uppercase sm:text-5xl lg:text-6xl">
              Parts catalogue
            </h2>
            <p className="max-w-md text-pretty text-ink-muted">
              Every part is in stock and tested on both outputs. Search it, filter by type, or open one to configure it.
            </p>
          </div>

          <Catalogue parts={parts} />
        </div>
      </section>

      {/* How it works: three drawn diagrams, each one the step it stands for */}
      <section id="how" aria-labelledby="how-heading" className="scroll-mt-4 border-y border-rule bg-paper-sunk">
        <div className="mx-auto w-full max-w-7xl px-4 py-[clamp(3.5rem,7vw,6rem)] sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-5">
            <h2 id="how-heading" className="font-display text-4xl leading-none font-bold uppercase sm:text-5xl lg:text-6xl">
              From this page to your project
            </h2>
            <p className="max-w-md text-pretty text-ink-muted">
              Three stops, and you leave with files rather than a dependency.
            </p>
          </div>
          <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {steps.map((step) => (
              <li key={step.title} className="reveal">
                <div className="rounded-lg border border-rule bg-paper p-4">
                  <StepDiagram step={step.step} />
                </div>
                <h3 className="mt-5 font-display text-3xl font-semibold uppercase">{step.title}</h3>
                <p className="mt-2 max-w-prose text-pretty text-ink-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Test report */}
      <section id="tests" aria-labelledby="report-heading" className="scroll-mt-4">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-[clamp(3.5rem,7vw,6rem)] sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div>
            <h2 id="report-heading" className="font-display text-4xl leading-none font-bold uppercase sm:text-5xl lg:text-6xl">
              Test report
            </h2>
            <p className="mt-6 max-w-md text-pretty text-ink-muted">
              What every part in stock is checked against, on every exported output. Automated tests cannot judge what a
              screen reader says, so each part has a manual checklist on its own page.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-ink font-mono text-xs text-ink-muted uppercase">
                  <th scope="col" className="py-3 pr-4 font-medium">
                    Check
                  </th>
                  <th scope="col" className="hidden py-3 pr-4 font-medium sm:table-cell">
                    What it proves
                  </th>
                  <th scope="col" className="py-3 text-right font-medium">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody>
                {tests.map(([check, proves]) => (
                  <tr key={check} className="reveal border-b border-rule align-top">
                    <th scope="row" className="py-4 pr-4 font-semibold">
                      {check}
                      {/* On phones the explanation sits under the check instead of in its own column. */}
                      <span className="mt-1 block font-normal text-pretty text-ink-muted sm:hidden">{proves}</span>
                    </th>
                    <td className="hidden py-4 pr-4 text-pretty text-ink-muted sm:table-cell">{proves}</td>
                    <td className="py-4 text-right">
                      <span className="inline-block -rotate-6 rounded border-2 border-pass px-2 font-display text-lg font-bold tracking-wider text-pass uppercase">
                        Pass
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Close */}
      <section
        aria-labelledby="close-heading"
        className="on-board relative isolate overflow-hidden bg-board-raised text-silk"
      >
        <div aria-hidden="true" className="board-grid absolute inset-0 -z-10 opacity-40" />
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-8 px-4 py-[clamp(3rem,6vw,5rem)] sm:px-6">
          <h2 id="close-heading" className="max-w-2xl font-display text-4xl leading-none font-bold uppercase sm:text-5xl">
            Pick a part and try it
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/date-picker" className="btn-pad">
              Date picker
              <Arrow />
            </Link>
            <Link href="/searchable-select" className="btn-outline-board">
              Searchable select
            </Link>
            <Link href="/modal" className="btn-outline-board">
              Modal dialog
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`size-4 ${className}`}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
