import { ViewTransition } from "react";
import { PartDrawing } from "@/components/part-drawing";
import { partBySlug } from "@/lib/parts";

/** Header for a component page: the part's drawing and name, what it is, and its spec line. */
export function PartHeader({ slug }: { slug: string }) {
  const part = partBySlug(slug);
  const specs = [
    ["Pattern", part.pattern],
    ["Category", `${part.category} · ${part.group}`],
    ["Outputs", "React + Tailwind, HTML/CSS/JS"],
    ["Status", "In stock, tested"],
  ];

  return (
    <div
      className="relative overflow-hidden border-b border-rule bg-paper-sunk"
      style={{ ["--part-accent" as string]: part.accent }}
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-(--part-accent)" />
      <div className="page-wrap flex flex-wrap items-end justify-between gap-x-10 gap-y-5 py-6 sm:py-8">
        <div className="flex items-center gap-4 sm:gap-6">
          {/* The catalogue card's drawing, morphed here when the card is opened. */}
          <ViewTransition name={`drawing-${slug}`} share="morph" default="none">
            <div className="drawing-host shrink-0 rounded-2xl bg-[color-mix(in_oklab,var(--part-accent)_24%,transparent)] px-3 py-2 text-ink">
              <PartDrawing slug={slug} accent={part.accent} className="h-14 w-auto sm:h-24" />
            </div>
          </ViewTransition>
          <div>
            <h1 className="font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
              <span className="slab-line">{part.name}</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-pretty text-ink-muted sm:mt-3 sm:text-base">{part.summary}</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-4 sm:gap-x-8 sm:gap-y-3">
          {specs.map(([term, detail]) => (
            <div key={term}>
              <dt className="font-mono text-xs text-ink-muted uppercase">{term}</dt>
              <dd className="mt-0.5 font-medium">{detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
