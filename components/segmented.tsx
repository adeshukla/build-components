"use client";

import type { ReactNode } from "react";

type Choice = { value: string; label: ReactNode };

/** A radio group drawn as segments. Native radios keep arrow-key selection and form semantics. */
export function Segmented({
  name,
  legend,
  hideLegend = false,
  description,
  value,
  choices,
  columns,
  onChange,
}: {
  name: string;
  legend: ReactNode;
  hideLegend?: boolean;
  description?: ReactNode;
  value: string;
  choices: Choice[];
  columns?: number;
  onChange: (value: string) => void;
}) {
  const descriptionId = description ? `${name}-description` : undefined;

  return (
    <fieldset aria-describedby={descriptionId} className="min-w-0">
      <legend className={hideLegend ? "sr-only" : "font-medium"}>{legend}</legend>
      {description && (
        <p id={descriptionId} className="mt-0.5 text-sm text-pretty text-ink-muted">
          {description}
        </p>
      )}
      <div
        className={`grid gap-0.5 rounded-md border border-rule-strong bg-paper-sunk p-0.5 ${hideLegend ? "" : "mt-2"}`}
        style={{ gridTemplateColumns: `repeat(${columns ?? choices.length}, minmax(0, 1fr))` }}
      >
        {choices.map((choice) => (
          <label key={choice.value} className="relative min-w-0 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={choice.value}
              checked={value === choice.value}
              onChange={() => onChange(choice.value)}
              className="peer sr-only"
            />
            <span className="block truncate rounded px-2.5 py-1.5 text-center text-sm text-ink-muted transition-colors duration-200 peer-checked:bg-board peer-checked:text-silk peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-board hover:text-ink peer-checked:hover:text-silk">
              {choice.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
