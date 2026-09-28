"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AddressFields } from "@/registry/address-fields/react/address-fields";
import { MenuBar } from "@/registry/menu-bar/react/menu-bar";

/** Everything the browser will stop on, in the order it will stop. */
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type=hidden])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const subjects = {
  "menu-bar": {
    name: "Menu bar",
    claim: "Three menus, nine items — and one stop for the whole bar. The arrows move inside it.",
    render: () => <MenuBar />,
  },
  "address-fields": {
    name: "Address fields",
    claim: "One stop per field, because each one is a separate answer somebody has to type.",
    render: () => <AddressFields />,
  },
} as const;

type Stop = { label: string; left: number; top: number };

/**
 * Walks the real tab order of a real component and numbers every stop.
 *
 * The numbers are worked out from the DOM, not written down: it finds what the browser will stop on, in
 * the order it will stop, and measures where each one is. The badges are decoration — the ordered list
 * below them is the same information in words, which is also the only version a screen reader gets.
 */
export function FocusTrace() {
  const id = useId();
  const [which, setWhich] = useState<keyof typeof subjects>("menu-bar");
  const [stops, setStops] = useState<Stop[] | null>(null);
  const panel = useRef<HTMLDivElement | null>(null);

  const measure = useCallback(() => {
    const node = panel.current;
    if (node === null) return;
    const box = node.getBoundingClientRect();
    const found = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE))
      // Nothing hidden: a stop nobody can reach is not a stop.
      .filter((element) => element.offsetWidth > 0 || element.offsetHeight > 0)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          label: (element.getAttribute("aria-label") ?? element.textContent ?? element.tagName).trim().slice(0, 60),
          left: rect.left - box.left,
          top: rect.top - box.top,
        };
      });
    setStops(found);
  }, []);

  // A measured position is only true until the page reflows, so it is taken again on a resize.
  useEffect(() => {
    if (stops === null) return;
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [stops, measure]);

  const subject = subjects[which];

  return (
    <div className="rounded-xl border border-rule bg-paper p-4 sm:p-6">
      <fieldset className="m-0 border-0 p-0">
        <legend className="font-mono text-xs tracking-wide text-ink-muted uppercase">Trace which part</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(subjects).map(([slug, one]) => (
            <label key={slug} className="cursor-pointer">
              <input
                type="radio"
                name={`${id}-subject`}
                value={slug}
                checked={which === slug}
                onChange={() => {
                  setWhich(slug as keyof typeof subjects);
                  // The old measurements belong to the old part; keep nothing that is now wrong.
                  setStops(null);
                }}
                className="peer sr-only"
              />
              <span className="inline-flex min-h-11 items-center rounded-full border border-rule-strong px-4 text-sm font-medium text-ink-muted transition-colors peer-checked:border-board peer-checked:bg-board peer-checked:text-silk peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-board hover:text-ink peer-checked:hover:text-silk">
                {one.name}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <p className="mt-3 max-w-prose text-sm text-pretty text-ink-muted">{subject.claim}</p>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={measure} className="btn-pad">
          {stops === null ? "Number the tab stops" : "Measure them again"}
        </button>
        {stops !== null && (
          <button
            type="button"
            onClick={() => setStops(null)}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-rule-strong px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board"
          >
            Clear the numbers
          </button>
        )}
      </div>

      {/* The count in words, politely, because a set of badges appearing is not a message. */}
      <p role="status" className="mt-3 text-sm text-ink-muted">
        {stops === null ? "" : `${stops.length} tab ${stops.length === 1 ? "stop" : "stops"} in ${subject.name.toLowerCase()}.`}
      </p>

      <div ref={panel} className="relative mt-5 rounded-lg border border-rule bg-paper-sunk p-4">
        {subject.render()}

        {stops?.map((stop, index) => (
          // Decoration: the list below says the same thing, and says it better.
          <span
            key={`${stop.label}-${index}`}
            aria-hidden="true"
            style={{ left: `${stop.left}px`, top: `${stop.top}px` }}
            className="pointer-events-none absolute z-20 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-board font-mono text-xs font-bold text-pad ring-2 ring-paper"
          >
            {index + 1}
          </span>
        ))}
      </div>

      {stops !== null && stops.length > 0 && (
        <div className="mt-5">
          <h3 className="font-mono text-xs tracking-wide text-ink-muted uppercase">The order, in words</h3>
          <ol className="mt-2 grid gap-1 pl-5 text-sm">
            {stops.map((stop, index) => (
              <li key={`${stop.label}-${index}-row`}>{stop.label === "" ? "(no accessible name)" : stop.label}</li>
            ))}
          </ol>
          <p className="mt-3 max-w-prose text-sm text-pretty text-ink-muted">
            A stop with no name in that list is a bug: it is something the keyboard lands on that a screen
            reader cannot describe. Every part in the catalogue is checked for exactly that.
          </p>
        </div>
      )}
    </div>
  );
}
