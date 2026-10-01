import Link from "next/link";
import { Catalogue } from "@/components/catalogue";
import { HeroIntro, HeroReel } from "@/components/hero-reel";
import { StepDiagram } from "@/components/how-graphics";
import { PartReel } from "@/components/part-reel";
import { inStock, parts } from "@/lib/parts";
import { templates } from "@/lib/templates";
import type { Metadata } from "next";

// Every other page sets its own canonical; the home page did not, so a
// trailing-slash or query-string variant could be indexed separately.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

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
    text: "Content, behaviour, add-ons and style, each in its own tab, with a search across every option and an orange dot on whatever you changed.",
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
      {/*
        The hero (D74): the headline and the search on one side, the parts at work on the other, and
        then the catalogue itself. A taste of it, not the whole thing; the catalogue has its own page,
        with the search in the address bar so a list can be shared.
      */}
      <section aria-labelledby="hero-heading">
        <div id="catalogue" className="mx-auto w-full max-w-7xl scroll-mt-4 px-4 pt-[clamp(2.5rem,6vw,5rem)] pb-[clamp(3.5rem,7vw,6rem)] sm:px-6">
          <Catalogue
            parts={parts}
            // Keyed: the catalogue (a client component) places these among its own children, and an element
            // made here on the server needs a key there, or React warns.
            intro={<HeroIntro key="intro" count={inStock.length} />}
            aside={<HeroReel key="reel" />}
          />
          <p className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/parts" className="btn-accent">
              {`All ${inStock.length} parts`}
              <Arrow />
            </Link>
            <Link href="#try" className="btn-glass">
              Try four of them
            </Link>
          </p>
        </div>
      </section>

      {/* Four real parts, one at a time */}
      <section id="try" aria-labelledby="try-heading" className="scroll-mt-4 sm:px-6">
        {/* Edge to edge on a phone: the reel needs the width. */}
        <div className="glass mx-auto w-full max-w-7xl px-4 py-[clamp(2.5rem,6vw,4.5rem)] max-sm:border-x-0 sm:rounded-[2rem] sm:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6 border-b border-rule pb-6">
            <h2 id="try-heading" className="font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
              Try them here first
            </h2>
            <p className="max-w-md text-pretty text-ink-muted">
              These are the exported components, running. Use the keyboard on them — that is the part most libraries get
              wrong, and the part you can check before you commit to anything.
            </p>
          </div>
          <div className="mt-12">
            <PartReel />
          </div>
        </div>
      </section>

      {/* Templates: the parts as whole pages, set up and taken home in one go (D75). */}
      <section aria-labelledby="templates-heading" className="px-4 py-[clamp(3.5rem,7vw,6rem)] sm:px-6">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
          <div>
            <h2 id="templates-heading" className="font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
              Whole pages, <em className="text-accent">ready to use</em>
            </h2>
            <p className="mt-5 max-w-xl text-lg text-pretty text-ink-muted">
              Templates put the parts together into pages. Set your name, colour and theme, check the page as a
              whole, and take it home with one command or as one HTML file.
            </p>
            <p className="mt-6">
              <Link href="/templates" className="btn-accent">
                Browse the templates
                <Arrow />
              </Link>
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {templates.map((template) => (
              <li key={template.id} className="glass relative rounded-2xl p-4 transition-[translate,scale] duration-500 ease-spring hover:-translate-y-1 active:scale-[0.97]">
                <h3 className="font-semibold">
                  <Link href={`/templates/${template.id}`} className="after:absolute after:inset-0 after:rounded-2xl">
                    {template.name}
                  </Link>
                </h3>
                <p className="mt-0.5 font-mono text-xs text-ink-muted">{`${template.type} · ${new Set(template.sections.map((section) => section.slug)).size} parts`}</p>
                <p className="mt-2 text-sm text-pretty text-ink-muted">{template.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The parts composed into whole screens: the thing a catalogue of cards cannot show. */}
      <section aria-labelledby="in-use-heading" className="border-y border-rule bg-paper-sunk">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-[clamp(3.5rem,7vw,6rem)] sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-16">
          <div>
            <h2
              id="in-use-heading"
              className="font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl"
            >
              See them together
            </h2>
            <p className="mt-5 max-w-xl text-lg text-pretty text-ink-muted">
              A part on its own page is easy to like. Three whole screens — a product page, a checkout, an
              admin screen — are made out of the catalogue and running, with a switch that draws a line
              round every part and names it.
            </p>
            <p className="mt-6 flex flex-wrap gap-3">
              <Link href="/in-use" className="btn-accent">
                Open the screens
                <Arrow />
              </Link>
              <Link href="/tested" className="btn-glass">
                Count the tab stops
              </Link>
            </p>
          </div>
          {/* Three labelled slabs: a picture of the idea, not a screenshot of it. */}
          <ul aria-hidden="true" className="grid gap-3">
            {[
              ["A product page", "7 parts"],
              ["A checkout", "5 parts"],
              ["An admin screen", "6 parts"],
            ].map(([name, count], index) => (
              <li
                key={name}
                className="reveal flex items-center justify-between gap-4 rounded-lg border border-rule bg-paper px-4 py-3.5"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <span className="font-display text-xl">{name}</span>
                <span className="font-mono text-xs text-ink-muted">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works: three drawn diagrams, each one the step it stands for */}
      <section id="how" aria-labelledby="how-heading" className="scroll-mt-4 border-y border-rule bg-paper-sunk">
        <div className="mx-auto w-full max-w-7xl px-4 py-[clamp(3.5rem,7vw,6rem)] sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-5">
            <h2 id="how-heading" className="font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
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
                <h3 className="mt-5 font-display text-3xl">{step.title}</h3>
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
            <h2 id="report-heading" className="font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
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
                      <span className="inline-block -rotate-6 rounded border-2 border-pass px-2 font-mono text-sm font-bold tracking-wider text-pass uppercase">
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
      <section aria-labelledby="close-heading" className="pb-[clamp(3rem,6vw,5rem)] sm:px-6">
        <div className="glass mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-8 px-4 py-[clamp(2.5rem,5vw,4rem)] max-sm:border-x-0 sm:rounded-[2rem] sm:px-10">
          <h2 id="close-heading" className="max-w-2xl font-display text-4xl leading-[1.05] sm:text-5xl">
            Pick a part and try it
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/date-picker" className="btn-accent">
              Date picker
              <Arrow />
            </Link>
            <Link href="/searchable-select" className="btn-glass">
              Searchable select
            </Link>
            <Link href="/modal" className="btn-glass">
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
