/** A plain reading page (About, Accessibility): datasheet header, then a single column of text. */
export function TextPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <main className="flex-1">
      <div className="border-b border-rule bg-paper-sunk">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
          <h1 className="font-display text-4xl leading-none font-bold uppercase sm:text-6xl">
            <span className="slab-line">{title}</span>
          </h1>
          <p className="mt-4 text-lg text-pretty text-ink-muted">{intro}</p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14 [&_a]:font-medium [&_a]:text-link [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:uppercase [&_h2:first-child]:mt-0 [&_li]:mt-2 [&_p]:mt-4 [&_p]:text-pretty [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </main>
  );
}
