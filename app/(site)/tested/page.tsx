import type { Metadata } from "next";
import Link from "next/link";
import { ContrastMeter } from "@/components/contrast-meter";
import { FocusTrace } from "@/components/focus-trace";
import { inStock } from "@/lib/parts";

export const metadata: Metadata = {
  title: "How it is tested",
  description:
    "What every part is tested with, on what, and two tools you can use on this page: a tracer that numbers the real tab order, and the contrast correction every part applies to an accent colour.",
  alternates: { canonical: "/tested" },
  openGraph: { title: "How it is tested", url: "/tested", images: "/opengraph-image" },
};

const checks = [
  [
    "axe, on every variant",
    "WCAG 2.0, 2.1 and 2.2 at A and AA, run with the component closed, open, mid-error and after whatever it does. Animations are waited out first, so a half-faded colour never passes as a real one.",
  ],
  [
    "Keyboard only",
    "Open it, move around it, pick something, close it — with no pointer at all. Focus has to come back where it started.",
  ],
  [
    "Both outputs, the same tests",
    "The React + Tailwind file and the plain HTML, CSS and JavaScript run the same spec. A fix to one that is not a fix to the other fails.",
  ],
  [
    "Three engines",
    "Chromium, WebKit — Safari's engine — and an emulated iPhone 15. Safari is where the focus bugs live: it does not focus a button when it is clicked, and that alone has broken four parts here.",
  ],
  [
    "In the real editor",
    "Every part is also opened in the editor on this site, in both outputs, inside the sandboxed preview frame, and any console error fails the run. That is what catches storage throwing where it is not allowed.",
  ],
  [
    "At three widths",
    "320, 768 and 1280, checking target sizes, whether anything overflows, and that nothing needs a sideways scroll.",
  ],
  [
    "Served exactly as exported",
    "The registry route is asked for the file with the options applied, and the test reads what comes back — so what is tested is what you would install.",
  ],
] as const;

export default function TestedPage() {
  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-7xl px-4 py-[clamp(2.5rem,5vw,4rem)] sm:px-6">
        <p className="font-mono text-xs tracking-wide text-ink-muted uppercase">
          <Link href="/" className="underline-offset-2 hover:underline">
            Home
          </Link>
          <span aria-hidden="true"> / </span>
          <span>How it is tested</span>
        </p>

        <h1 className="mt-3 max-w-4xl font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.92] font-bold uppercase">
          Tested, not asserted
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-pretty text-ink-muted">
          Every claim on this site is a test somewhere. Here is what runs, and two tools that do the same
          maths the parts do — so you can check the claims on this page rather than take them.
        </p>

        <section aria-labelledby="checks-heading" className="mt-14">
          <h2
            id="checks-heading"
            className="font-display text-4xl leading-none font-bold uppercase sm:text-5xl"
          >
            What runs
          </h2>
          <p className="mt-3 max-w-2xl text-pretty text-ink-muted">
            On all {inStock.length} parts, on both outputs, on every commit that touches them.
          </p>

          <dl className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-2">
            {checks.map(([term, detail]) => (
              <div key={term} className="border-t border-rule pt-4">
                <dt className="font-display text-xl font-semibold uppercase">{term}</dt>
                <dd className="mt-2 max-w-prose text-pretty text-ink-muted">{detail}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="trace-heading" className="mt-16">
          <h2 id="trace-heading" className="font-display text-4xl leading-none font-bold uppercase sm:text-5xl">
            Count the tab stops yourself
          </h2>
          <p className="mt-3 max-w-2xl text-pretty text-ink-muted">
            The number of times Tab stops inside a component is the difference between a part you can use
            and one you give up on. This reads the real order out of the page and numbers it.
          </p>
          <div className="mt-8">
            <FocusTrace />
          </div>
        </section>

        <section aria-labelledby="contrast-heading" className="mt-16">
          <h2 id="contrast-heading" className="font-display text-4xl leading-none font-bold uppercase sm:text-5xl">
            Pick a colour that fails
          </h2>
          <p className="mt-3 max-w-2xl text-pretty text-ink-muted">
            Every part takes an accent colour, and every part corrects it before using it as text. This is
            that correction, running — iOS blue on white is 3.9:1, which is how a system colour ends up
            being a WCAG failure.
          </p>
          <div className="mt-8">
            <ContrastMeter />
          </div>
        </section>

        <section aria-labelledby="not-heading" className="mt-16 max-w-2xl">
          <h2 id="not-heading" className="font-display text-3xl leading-none font-bold uppercase">
            What is not tested here
          </h2>
          <p className="mt-3 text-pretty text-ink-muted">
            Automated checks find maybe a third of what is wrong with a page. They cannot tell you whether
            a label makes sense, whether an order is logical, or how a part sounds read aloud. Every part
            ships with a manual checklist for exactly that, and a real screen-reader pass on a real iPhone
            stays on it — emulation is not a device.
          </p>
          <p className="mt-4">
            <Link href="/accessibility" className="font-medium underline decoration-2 underline-offset-4">
              The accessibility statement
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
