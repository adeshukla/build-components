import type { ReactNode } from "react";

/** A live component set on a white card inside a pane of glass. */
export function MountedPart({ caption, children }: { caption: ReactNode; children: ReactNode }) {
  return (
    <figure className="glass relative mx-auto w-full max-w-md rounded-[1.75rem] p-2.5">
      {/* Always white: the parts on it use their light theme, whatever the site theme is. */}
      <div className="rounded-[1.25rem] bg-white p-6 text-[#1c1a17] shadow-[0_1px_2px_rgb(60_40_20/0.08)] sm:p-8">
        {children}
      </div>
      <figcaption className="px-2 pt-2.5 pb-0.5 text-center font-mono text-xs tracking-wide text-ink-muted">
        {caption}
      </figcaption>
    </figure>
  );
}
