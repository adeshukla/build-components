import Link from "next/link";
import { BoardTraces } from "@/components/board-traces";
import { MountedPart } from "@/components/mounted-part";
import { parts } from "@/lib/parts";
import { DatePicker } from "@/registry/date-picker/react/date-picker";
import { Modal } from "@/registry/modal/react/modal";
import { SearchableSelect } from "@/registry/searchable-select/react/searchable-select";

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
    title: "Configure",
    text: "Content, behaviour, add-ons and style, each in its own tab, with a search to find any option.",
    detail: "Content · Behaviour · Add-ons · Style",
  },
  {
    title: "Test",
    text: "Run the exported code, not a mock-up. Switch output and screen width, and follow the keyboard map.",
    detail: "React + Tailwind · HTML/CSS/JS · Phone · Tablet · Desktop",
  },
  {
    title: "Take it home",
    text: "Copy the files, or install them with one shadcn command. The code is yours, with no library behind it.",
    detail: "npx shadcn@latest add …/r/date-picker.json",
  },
];

export default function Home() {
  return (
    <main>
      {/* Hero: the board, with real parts mounted on it */}
      <section aria-labelledby="hero-heading" className="on-board relative isolate overflow-hidden bg-board text-silk">
        <div aria-hidden="true" className="board-grid absolute inset-0 -z-20 opacity-50" />
        <BoardTraces />
        <div className="mx-auto grid w-full max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <h1
              id="hero-heading"
              className="font-display text-[clamp(3.5rem,10vw,6rem)] leading-[0.88] font-bold tracking-[-0.01em] uppercase"
            >
              <span className="slab-line">Accessible parts.</span>
              <span className="slab-line text-pad" style={{ animationDelay: "140ms" }}>
                Plain code.
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-lg text-pretty text-silk-muted">
              Set up a component without writing code, test the exact files you will export, then take them into your
              project as React + Tailwind or HTML/CSS/JS. No library to install.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="#catalogue" className="btn-pad">
                Open the catalogue
                <Arrow />
              </Link>
              <Link href="/date-picker" className="btn-outline-board">
                Try Almanac, the date picker
              </Link>
            </div>
            <p className="mt-8 font-mono text-xs tracking-wide text-silk-muted">
              Every part ships tested in Chromium, WebKit and on iPhone.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1 lg:gap-10">
            <MountedPart caption="Almanac · date picker · live, try it">
              <DatePicker />
            </MountedPart>
            <div className="lg:translate-x-10">
              <MountedPart caption="Sextant · searchable select · live, try it">
                <SearchableSelect />
              </MountedPart>
            </div>
            <div className="sm:col-span-2 lg:col-span-1 lg:translate-x-20">
              <MountedPart caption="Porthole · modal · live, try it">
                <Modal />
              </MountedPart>
            </div>
          </div>
        </div>
      </section>

      {/* Catalogue */}
      <section id="catalogue" aria-labelledby="catalogue-heading" className="scroll-mt-4">
        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-5">
            <h2 id="catalogue-heading" className="font-display text-5xl leading-none font-bold uppercase sm:text-6xl">
              Parts catalogue
            </h2>
            <p className="max-w-md text-pretty text-ink-muted">
              All eleven parts are in stock, and every one of them is tested on both outputs.
            </p>
          </div>

          <ul>
            {parts.map((part) => {
              const inStock = part.status === "in-stock";
              return (
                <li
                  key={part.slug}
                  style={{ ["--part-accent" as string]: part.accent }}
                  className={`reveal group relative grid gap-x-8 gap-y-2 border-b border-rule py-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_11rem] md:items-center ${inStock ? "transition-colors hover:bg-paper-sunk" : ""}`}
                >
                  {inStock && (
                    <span
                      aria-hidden="true"
                      className="absolute top-0 bottom-0 -left-4 w-1 origin-center scale-y-0 rounded-full bg-(--part-accent) transition-transform duration-500 ease-out-expo group-hover:scale-y-100"
                    />
                  )}
                  <div className="flex items-baseline gap-3">
                    <span
                      aria-hidden="true"
                      className={`size-2.5 shrink-0 rounded-full ${inStock ? "bg-(--part-accent)" : "border border-rule-strong"}`}
                    />
                    <h3 className="font-display text-3xl leading-none font-semibold uppercase">
                      {inStock ? (
                        <Link href={`/${part.slug}`} className="after:absolute after:inset-0 hover:underline">
                          {part.codename}
                        </Link>
                      ) : (
                        <span className="text-ink-muted">{part.codename}</span>
                      )}
                    </h3>
                  </div>
                  <div>
                    <p className="font-medium">{part.name}</p>
                    <p className="mt-0.5 text-pretty text-ink-muted">{part.summary}</p>
                    <p className="mt-1 text-sm text-ink-muted">Pattern: {part.pattern}</p>
                  </div>
                  <p className="md:text-right">
                    {inStock ? (
                      <span className="inline-flex items-center gap-2 font-semibold text-link">
                        Configure and test
                        <Arrow className="transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    ) : (
                      <span className="inline-block rounded border border-dashed border-rule-strong px-2 py-1 font-mono text-xs text-ink-muted uppercase">
                        Coming soon
                      </span>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section id="how" aria-labelledby="how-heading" className="scroll-mt-4 border-y border-rule bg-paper-sunk">
        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
          <h2 id="how-heading" className="font-display text-5xl leading-none font-bold uppercase sm:text-6xl">
            From this page to your project
          </h2>
          <ol className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            <span
              aria-hidden="true"
              className="absolute top-5 right-[16%] left-[16%] hidden h-0.5 bg-rule-strong md:block"
            />
            {steps.map((step, i) => (
              <li key={step.title} className="reveal relative">
                <span
                  aria-hidden="true"
                  className="relative grid size-10 place-items-center rounded-full border-2 border-board bg-pad font-display text-xl font-bold text-board md:mx-auto"
                >
                  {i + 1}
                </span>
                <h3 className="mt-5 font-display text-3xl font-semibold uppercase md:text-center">{step.title}</h3>
                <p className="mt-2 text-pretty text-ink-muted md:text-center">{step.text}</p>
                <p className="mt-4 rounded border border-rule bg-paper px-3 py-2 font-mono text-xs break-words text-ink-muted md:text-center">
                  {step.detail}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Test report */}
      <section id="tests" aria-labelledby="report-heading" className="scroll-mt-4">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 id="report-heading" className="font-display text-5xl leading-none font-bold uppercase sm:text-6xl">
              Test report
            </h2>
            <p className="mt-5 max-w-md text-pretty text-ink-muted">
              What every part in stock is checked against, on every exported output. Automated tests cannot judge what
              a screen reader says, so each part has a manual checklist on its own page.
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
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-8 px-4 py-16 sm:px-6">
          <h2 id="close-heading" className="max-w-2xl font-display text-5xl leading-none font-bold uppercase">
            Pick a part and try it
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/date-picker" className="btn-pad">
              Almanac
              <Arrow />
            </Link>
            <Link href="/searchable-select" className="btn-outline-board">
              Sextant
            </Link>
            <Link href="/modal" className="btn-outline-board">
              Porthole
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
      className={`size-4 ${className}`}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
