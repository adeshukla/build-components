import { partBySlug } from "@/lib/parts";

/** Datasheet header for a component page: name, summary and the part's spec line. */
export function PartHeader({ slug }: { slug: string }) {
  const part = partBySlug(slug);
  const specs = [
    ["Part no.", part.partNumber],
    ["Pattern", part.pattern],
    ["Outputs", "React + Tailwind, HTML/CSS/JS"],
    ["Status", "In stock, tested"],
  ];

  return (
    <div className="border-b border-rule bg-paper-sunk">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-end justify-between gap-x-10 gap-y-6 px-4 py-8 sm:px-6">
        <div>
          <h1 className="font-display text-5xl leading-none font-bold uppercase sm:text-6xl">{part.name}</h1>
          <p className="mt-3 max-w-2xl text-pretty text-ink-muted">{part.summary}</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-4">
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
