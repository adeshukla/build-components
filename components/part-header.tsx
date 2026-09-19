import { partBySlug } from "@/lib/parts";

/** Datasheet header for a component page: the part's name, what it is, and its spec line. */
export function PartHeader({ slug }: { slug: string }) {
  const part = partBySlug(slug);
  const specs = [
    ["Component", part.name],
    ["Pattern", part.pattern],
    ["Outputs", "React + Tailwind, HTML/CSS/JS"],
    ["Status", "In stock, tested"],
  ];

  return (
    <div
      className="relative overflow-hidden border-b border-rule bg-paper-sunk"
      style={{ ["--part-accent" as string]: part.accent }}
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-(--part-accent)" />
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-end justify-between gap-x-10 gap-y-5 px-4 py-6 sm:px-6 sm:py-8">
        <div>
          <h1 className="font-display text-4xl leading-none font-bold uppercase sm:text-5xl lg:text-6xl">
            <span className="slab-line">{part.codename}</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-pretty text-ink-muted sm:mt-3 sm:text-base">
            <span className="font-medium text-ink">{part.name}.</span> {part.summary}
          </p>
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
