import Link from "next/link";
import { LogoMark } from "@/components/site-header";
import { author } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="glass border-x-0 border-b-0">
      <div className="page-wrap grid gap-10 py-14 md:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <LogoMark className="size-11" />
            <p className="font-display text-4xl leading-none">Build Components</p>
          </div>
          <p className="mt-4 max-w-md text-pretty text-ink-muted">
            Accessible parts, plain code. Configure a component, test the files you&apos;ll export, and take them
            into your project. No library to install.
          </p>
          <p className="mt-6">
            <Link href="/parts" className="btn-glass">
              Browse the catalogue
            </Link>
          </p>
        </div>

        <div>
          <h2 className="font-mono text-xs font-semibold tracking-widest text-link uppercase">Every output is tested</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li>axe checks against WCAG 2.2 AA</li>
            <li>Keyboard-only flows</li>
            <li>Chromium, WebKit (Safari) and an emulated iPhone</li>
            <li>React + Tailwind and HTML/CSS/JS, the same tests on both</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-rule">
        <div className="page-wrap flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3 font-mono text-xs text-ink-muted">
          <p>
            Built by {author.name} ·{" "}
            <a href={author.url} className="inline-block py-1.5 underline underline-offset-2 hover:text-ink">
              devstash.me
            </a>
          </p>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-4">
              {[
                ["/parts", "Catalogue"],
                ["/templates", "Templates"],
                ["/in-use", "In use"],
                ["/tested", "How it is tested"],
                ["/start", "Get started"],
                ["/about", "About"],
                ["/accessibility", "Accessibility"],
                ["/sitemap.xml", "Sitemap"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="inline-block py-1.5 underline-offset-2 hover:text-ink hover:underline">
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
