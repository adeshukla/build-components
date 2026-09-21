"use client";

import Link from "next/link";
import { useState } from "react";
import { categories, type Part } from "@/lib/parts";

const ALL = "All";
/** How many parts "All" shows before the rest are asked for: two rows on a wide screen. */
const PREVIEW = 8;

/**
 * The parts catalogue as a compact grid, filtered by type instead of one long list.
 * Filters are native radios, so arrow keys move between them and a screen reader hears the group.
 */
export function Catalogue({ parts }: { parts: Part[] }) {
  const [filter, setFilter] = useState<string>(ALL);
  const [expanded, setExpanded] = useState(false);
  const matching = filter === ALL ? parts : parts.filter((part) => part.category === filter);
  const collapsible = filter === ALL && matching.length > PREVIEW;
  const shown = collapsible && !expanded ? matching.slice(0, PREVIEW) : matching;
  const choices = [ALL, ...categories].map((name) => ({
    name,
    count: name === ALL ? parts.length : parts.filter((part) => part.category === name).length,
  }));

  return (
    <div className="mt-6">
      <fieldset>
        <legend className="sr-only">Show parts of type</legend>
        <div className="flex flex-wrap gap-2">
          {choices.map((choice) => (
            <label key={choice.name} className="cursor-pointer">
              <input
                type="radio"
                name="catalogue-filter"
                value={choice.name}
                checked={filter === choice.name}
                onChange={() => setFilter(choice.name)}
                className="peer sr-only"
              />
              <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-rule-strong px-3.5 text-sm font-medium text-ink-muted transition-colors peer-checked:border-board peer-checked:bg-board peer-checked:text-silk peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-board hover:text-ink peer-checked:hover:text-silk">
                {choice.name}
                <span className="font-mono text-xs opacity-80">{choice.count}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="sr-only" aria-live="polite">
        {filter === ALL ? "" : `Showing ${matching.length} ${filter.toLowerCase()} parts.`}
      </p>

      <ul id="catalogue-list" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {shown.map((part) => {
          const inStock = part.status === "in-stock";
          return (
            <li
              key={part.slug}
              style={{ ["--part-accent" as string]: part.accent }}
              className={`group relative flex flex-col rounded-lg border border-rule bg-paper p-4 outline-offset-2 outline-board has-[a:focus-visible]:outline-2 ${inStock ? "transition-[border-color,box-shadow] hover:border-(--part-accent) hover:shadow-md" : "opacity-70"}`}
            >
              <span aria-hidden="true" className="absolute inset-x-4 top-0 h-0.5 rounded-b bg-(--part-accent)" />
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-xl leading-none font-semibold uppercase">
                  {inStock ? (
                    <Link
                      href={`/${part.slug}`}
                      className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none"
                    >
                      {part.codename}
                    </Link>
                  ) : (
                    part.codename
                  )}
                </h3>
                <span className="font-mono text-[0.6875rem] text-ink-muted uppercase">{part.category}</span>
              </div>
              <p className="mt-1.5 text-sm font-medium">{part.name}</p>
              <p className="mt-1 line-clamp-2 text-sm text-pretty text-ink-muted">{part.summary}</p>
              {!inStock && (
                <p className="mt-2 font-mono text-xs text-ink-muted uppercase">Coming soon</p>
              )}
            </li>
          );
        })}
      </ul>
      {collapsible && (
        <p className="mt-6 text-center">
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls="catalogue-list"
            onClick={() => setExpanded(!expanded)}
            className="btn-ink"
          >
            {expanded ? "Show fewer parts" : `Show all ${matching.length} parts`}
          </button>
        </p>
      )}
    </div>
  );
}
