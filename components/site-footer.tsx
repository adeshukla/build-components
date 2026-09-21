import Link from "next/link";
import { ChipMark } from "@/components/site-header";
import { author } from "@/lib/site";

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
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 font-mono text-xs text-silk-muted sm:px-6">
          <p>
            Built by {author.name} ·{" "}
            <a href={author.url} className="inline-block py-1.5 underline underline-offset-2 hover:text-silk">
              devstash.me
            </a>
          </p>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-4">
              {[
                ["/about", "About"],
                ["/accessibility", "Accessibility"],
                ["/sitemap.xml", "Sitemap"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="inline-block py-1.5 underline-offset-2 hover:text-silk hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
