import Link from "next/link";
import { ChipMark } from "@/components/site-header";

export function SiteFooter() {
  return (
    <footer className="on-board board-grid border-t border-board-line bg-board text-silk">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <ChipMark className="size-11" />
            <p className="font-display text-3xl leading-none font-semibold tracking-wide uppercase">Build Components</p>
          </div>
          <p className="mt-4 max-w-md text-pretty text-silk-muted">
            Accessible parts, plain code. Configure a component, test the files you&apos;ll export, and take them
            into your project. No library to install.
          </p>
          <p className="mt-6">
            <Link href="/#catalogue" className="btn-outline-board">
              Browse the catalogue
            </Link>
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold tracking-wide text-pad uppercase">Every output is tested</h2>
          <ul className="mt-3 space-y-2 text-sm text-silk-muted">
            <li>axe checks against WCAG 2.2 AA</li>
            <li>Keyboard-only flows</li>
            <li>Chromium, WebKit (Safari) and an emulated iPhone</li>
            <li>React + Tailwind and HTML/CSS/JS, the same tests on both</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-board-line">
        <p className="mx-auto flex w-full max-w-7xl flex-wrap justify-between gap-2 px-4 py-4 font-mono text-xs text-silk-muted sm:px-6">
          <span>Catalogue rev 0.2</span>
          <span>Plain code. No runtime dependency.</span>
        </p>
      </div>
    </footer>
  );
}
