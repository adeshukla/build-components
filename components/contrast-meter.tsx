"use client";

import { useId, useState } from "react";

/** Relative luminance, the same maths the exported components use. */
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Darkens or lightens the accent until it clears 4.5:1 — the function every part here ships with. */
function readableAccent(hex: string, onDark: boolean) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const surface = onDark ? 0.02 : 1;
  for (let step = 0; step <= 20; step++) {
    const shifted = channels.map((c) => Math.round(onDark ? c + (255 - c) * (step / 20) : c * (1 - step / 20)));
    const value = `#${shifted.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
    const l = luminance(value);
    const contrast = (Math.max(l, surface) + 0.05) / (Math.min(l, surface) + 0.05);
    if (contrast >= 4.5) return value;
  }
  return onDark ? "#ffffff" : "#000000";
}

const say = (value: number) => `${Math.floor(value * 10) / 10}:1`;

/**
 * The correction every part applies to an accent colour, shown working.
 *
 * This is not a general contrast tool: it runs the exact function the exported components ship with, so
 * what it says about a colour is what those components will actually do with it.
 */
export function ContrastMeter() {
  const id = useId();
  const [accent, setAccent] = useState("#e6b24a");

  const onLight = ratio(accent, "#ffffff");
  const onDark = ratio(accent, "#141019");
  const fixedLight = readableAccent(accent, false);
  const fixedDark = readableAccent(accent, true);

  const rows = [
    { label: "As you picked it, on white", colour: accent, against: "#ffffff", value: onLight },
    { label: "Corrected, on white", colour: fixedLight, against: "#ffffff", value: ratio(fixedLight, "#ffffff") },
    { label: "As you picked it, on ink", colour: accent, against: "#141019", value: onDark },
    { label: "Corrected, on ink", colour: fixedDark, against: "#141019", value: ratio(fixedDark, "#141019") },
  ];

  return (
    <div className="rounded-xl border border-rule bg-paper p-4 sm:p-6">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor={`${id}-colour`} className="block text-sm font-medium">
            An accent colour
          </label>
          <input
            id={`${id}-colour`}
            type="color"
            value={accent}
            onChange={(event) => setAccent(event.target.value)}
            className="mt-1.5 h-11 w-20 cursor-pointer rounded-md border border-rule-strong bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board"
          />
        </div>
        <p className="max-w-md text-sm text-pretty text-ink-muted">
          Pick anything, including something that fails. Every part corrects a colour before using it as
          text, so what you choose is never what gets printed.
        </p>
      </div>

      <table className="mt-6 w-full border-collapse text-left text-sm">
        <caption className="sr-only">The accent, before and after correction, on both surfaces</caption>
        <thead>
          <tr className="border-b-2 border-ink">
            <th scope="col" className="py-2 font-medium">
              Where
            </th>
            <th scope="col" className="py-2 font-medium">
              Sample
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              Contrast
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              4.5:1
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const passes = row.value >= 4.5;
            return (
              <tr key={row.label} className="border-b border-rule">
                <th scope="row" className="py-3 pr-3 font-normal text-ink-muted">
                  {row.label}
                </th>
                <td className="py-3 pr-3">
                  {/* The sample carries the colour; the numbers next to it carry the meaning. */}
                  <span
                    className="inline-block rounded px-2 py-1 font-semibold"
                    style={{ color: row.colour, background: row.against }}
                  >
                    Sample text
                  </span>
                </td>
                <td className="py-3 pr-3 text-right font-mono tabular-nums">{say(row.value)}</td>
                {/* Pass or fail in words, never a green or red dot on its own. */}
                <td className={`py-3 text-right font-semibold ${passes ? "text-ink" : "text-ink-muted"}`}>
                  {passes ? "Passes" : "Fails"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p role="status" className="mt-4 text-sm text-pretty text-ink-muted">
        {onLight >= 4.5 && onDark >= 4.5
          ? "That one clears 4.5:1 on both surfaces as it is, so nothing is corrected."
          : `On its own that colour fails on ${onLight >= 4.5 ? "ink" : onDark >= 4.5 ? "white" : "both surfaces"}. The parts print ${fixedLight} on white and ${fixedDark} on ink instead.`}
      </p>
    </div>
  );
}
