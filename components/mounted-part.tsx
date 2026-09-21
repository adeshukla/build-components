import type { ReactNode } from "react";

/** A live component mounted on a white chip with gold pins, labelled like silkscreen. */
export function MountedPart({ caption, children }: { caption: ReactNode; children: ReactNode }) {
  const pins = Array.from({ length: 7 });

  return (
    <figure className="relative mx-auto w-full max-w-md">
      {(["left", "right"] as const).map((side) => (
        <div
          key={side}
          aria-hidden="true"
          className={`absolute top-10 bottom-10 flex w-3 flex-col justify-between ${side === "left" ? "-left-3" : "-right-3"}`}
        >
          {pins.map((_, i) => (
            <span
              key={i}
              className={`pin h-2 ${side === "left" ? "rounded-l-sm" : "rounded-r-sm"}`}
              style={{ animationDelay: `${600 + i * 70}ms` }}
            />
          ))}
        </div>
      ))}
      {/* Always white: the parts on it use their light theme, whatever the site theme is. */}
      <div className="relative rounded-lg bg-white p-6 text-[#16121f] shadow-[0_30px_60px_-24px_rgb(8_3_24/0.7)] sm:p-8">
        <span aria-hidden="true" className="absolute top-0 left-1/2 h-3 w-8 -translate-x-1/2 rounded-b-full bg-board" />
        <span aria-hidden="true" className="absolute top-4 left-4 size-2 rounded-full bg-rule-strong" />
        {children}
      </div>
      <figcaption className="mt-4 text-center font-mono text-xs tracking-wide text-silk-muted">{caption}</figcaption>
    </figure>
  );
}
