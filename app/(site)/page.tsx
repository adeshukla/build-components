import Link from "next/link";
import { Catalogue } from "@/components/catalogue";
import { HeroIntro, HeroReel } from "@/components/hero-reel";
import { StepDiagram } from "@/components/how-graphics";
import { inStock, parts } from "@/lib/parts";
import { templates } from "@/lib/templates";
import type { Metadata } from "next";

// Every other page sets its own canonical; the home page did not, so a
// trailing-slash or query-string variant could be indexed separately.
export const metadata: Metadata = {
  alternates: { canonical: "/", types: { "application/rss+xml": [{ url: "/changes.xml", title: "Part changes" }] } },
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
        The hero (D74): the headline and the search on one side, the parts at work on the other. Then,
        after a clear break, the catalogue: a taste of it, not the whole thing. Four sections in all,
        each with room around it (D76).
      */}
      <section aria-labelledby="hero-heading">
        <div id="catalogue" className="page-wrap scroll-mt-4 pt-[clamp(3rem,8vw,7rem)] pb-[clamp(4rem,9vw,8rem)]">
          <Catalogue
            parts={parts}
            // Keyed: the catalogue (a client component) places these among its own children, and an element
            // made here on the server needs a key there, or React warns.
            intro={<HeroIntro key="intro" count={inStock.length} />}
            aside={<HeroReel key="reel" />}
            browse={
              <div key="browse" className="mt-[clamp(5rem,11vw,9rem)] flex flex-wrap items-end justify-between gap-4">
                <h2 id="catalogue-heading" className="font-display text-4xl leading-[1.05] sm:text-5xl">
                  Browse the parts
                </h2>
                <Link href="/parts" className="inline-flex min-h-11 items-center text-sm font-medium text-link underline underline-offset-4 hover:text-ink">
                  {`See all ${inStock.length}`}
                </Link>
              </div>
            }
          />
          <p className="mt-12 flex justify-center">
            <Link href="/parts" className="btn-accent">
              {`All ${inStock.length} parts`}
              <Arrow />
            </Link>
          </p>
        </div>
      </section>

      {/* Templates: the parts as whole pages, set up and taken home in one go (D75). */}
      <section aria-labelledby="templates-heading" className="border-y border-rule bg-paper-sunk/60 section-y">
        <div className="page-wrap grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-20">
          <div>
            <h2 id="templates-heading" className="font-display text-4xl leading-[1.05] text-balance sm:text-5xl lg:text-6xl">
              Whole pages, <em className="text-accent">ready to use</em>
            </h2>
            <p className="mt-6 max-w-md text-lg text-pretty text-ink-muted">
              Templates put the parts together into pages. Set your name, colour and theme, then take it home.
            </p>
            <p className="mt-8">
              <Link href="/templates" className="btn-accent">
                Browse the templates
                <Arrow />
              </Link>
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {templates.slice(0, 8).map((template) => (
              <li
                key={template.id}
                className="glass spot relative rounded-2xl p-6 transition-[translate,scale] duration-500 ease-spring hover:-translate-y-1 active:scale-[0.97]"
              >
                <h3 className="font-semibold">
                  <Link href={`/templates/${template.id}`} className="after:absolute after:inset-0 after:rounded-2xl">
                    {template.name}
                  </Link>
                </h3>
                <p className="mt-1 font-mono text-xs text-ink-muted">{`${template.type} · ${new Set(template.sections.map((section) => section.slug)).size} parts`}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works: three drawn diagrams, each one the step it stands for */}
      <section id="how" aria-labelledby="how-heading" className="scroll-mt-4 section-y">
        <div className="page-wrap">
          <h2 id="how-heading" className="font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
            From this page to your project
          </h2>
          <p className="mt-5 max-w-md text-lg text-pretty text-ink-muted">Three stops, and you leave with files, not a dependency.</p>
          <ol className="mt-14 grid gap-12 md:grid-cols-3 md:gap-10">
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
      <section id="tests" aria-labelledby="report-heading" className="scroll-mt-4 border-t border-rule section-y">
        <div className="page-wrap grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <h2 id="report-heading" className="font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
              Test report
            </h2>
            <p className="mt-6 max-w-md text-pretty text-ink-muted">
              What every part is checked against, on every exported output. A screen reader cannot be judged by a
              test, so each part also has a manual checklist on its own page.
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
