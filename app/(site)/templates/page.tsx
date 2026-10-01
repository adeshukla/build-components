import type { Metadata } from "next";
import Link from "next/link";
import { PartDrawing } from "@/components/part-drawing";
import { partBySlug } from "@/lib/parts";
import { templates } from "@/lib/templates";

export const metadata: Metadata = {
  title: "Templates",
  description:
    "Whole pages made from tested parts: set the name, colour, theme and sections, check the page as a whole, and take it home as React or one HTML file.",
  alternates: { canonical: "/templates" },
  openGraph: { title: "Templates", url: "/templates", images: "/opengraph-image" },
};

const promises = [
  ["Set it up", "Your product name, brand colour, light or dark, and which sections to keep."],
  ["Checked as a page", "One h1, landmarks, a skip link first, every field labelled, tested with axe and the keyboard."],
  ["Take it home", "One install command, a page.tsx that arranges the parts, or a single HTML file."],
];

export default function TemplatesPage() {
  return (
    <main className="flex-1">
      <div className="page-wrap pt-[clamp(3rem,8vw,7rem)] pb-[clamp(4rem,9vw,8rem)]">
        <h1 className="max-w-4xl font-display text-[clamp(2.75rem,6.5vw,5rem)] leading-[1.02] text-balance">
          Templates. <em className="text-accent">Whole pages, ready to use.</em>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-pretty text-ink-muted">
          Each template is a page put together from parts in the catalogue: nothing on it is drawn by hand.
        </p>
        <ul className="mt-12 grid gap-8 border-t border-rule pt-8 sm:grid-cols-3">
          {promises.map(([title, text]) => (
            <li key={title}>
              <h2 className="font-display text-2xl leading-tight">{title}</h2>
              <p className="mt-2 max-w-xs text-sm text-pretty text-ink-muted">{text}</p>
            </li>
          ))}
        </ul>

        <h2 className="sr-only">Every template</h2>
        <ul className="grid-gap mt-[clamp(4rem,8vw,6rem)] grid sm:grid-cols-2 xl:grid-cols-4">
          {templates.map((template) => {
            const slugs = [...new Set(template.sections.map((section) => section.slug))];
            return (
              <li
                key={template.id}
                className="drawing-host glass spot group relative flex flex-col rounded-2xl p-2 outline-offset-3 outline-accent transition-[translate,scale] duration-500 ease-spring has-[a:focus-visible]:outline-2 hover:-translate-y-1 active:scale-[0.97]"
              >
                {/* The page in miniature: each of its parts, drawn in order from the top. */}
                <div aria-hidden="true" className="grid gap-1 rounded-xl bg-paper-sunk p-3">
                  {template.sections.map((section) => {
                    const part = partBySlug(section.slug);
                    return (
                      <div
                        key={section.slug}
                        className="rounded-md bg-[color-mix(in_oklab,var(--part-accent)_24%,transparent)] px-2 py-1 text-ink"
                        style={{ ["--part-accent" as string]: part.accent }}
                      >
                        <PartDrawing slug={section.slug} accent={part.accent} className="mx-auto h-9 w-auto" />
                      </div>
                    );
                  })}
                </div>
                <div className="px-2 pt-3 pb-1.5">
                  <h3 className="text-base font-semibold">
                    <Link
                      href={`/templates/${template.id}`}
                      className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none"
                    >
                      {template.name}
                    </Link>
                  </h3>
                  <p className="mt-0.5 font-mono text-xs text-ink-muted">{`${template.type} · ${slugs.length} parts`}</p>
                  <p className="mt-2 text-sm text-pretty text-ink-muted">{template.summary}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
