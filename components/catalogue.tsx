"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { demos } from "@/lib/demos";
import { categories, type Part } from "@/lib/parts";

const ALL = "All";
/** How many parts "All" shows before the rest are asked for: two rows on a wide screen. */
const PREVIEW = 8;

/** Matches a part on anything a person might type: its name, what it does, its pattern or its URL. */
function matches(part: Part, query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = `${part.name} ${part.summary} ${part.pattern} ${part.category} ${part.slug}`.toLowerCase();
  return words.every((word) => haystack.includes(word));
}

/**
 * The parts catalogue: search and type filters instead of one long list.
 * Filters are native radios, so arrow keys move between them and a screen reader hears the group.
 */
export function Catalogue({ parts }: { parts: Part[] }) {
  const id = useId();
  const [filter, setFilter] = useState<string>(ALL);
  const [query, setQuery] = useState("");
  // Only the card being pointed at or tabbed to runs a preview, so one frame exists at a time.
  const [showing, setShowing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const searching = query.trim() !== "";
  const matching = parts.filter((part) => (filter === ALL || part.category === filter) && matches(part, query));
  // While searching, everything that matches is shown: hiding results behind a button would be odd.
  const collapsible = !searching && filter === ALL && matching.length > PREVIEW;
  const shown = collapsible && !expanded ? matching.slice(0, PREVIEW) : matching;
  const choices = [ALL, ...categories].map((name) => ({
    name,
    count: parts.filter((part) => (name === ALL || part.category === name) && matches(part, query)).length,
  }));

  // "/" jumps to the search box, as it does in most tools — but never while someone is typing.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) return;
      event.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.select();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="w-full max-w-sm">
          <label htmlFor={`${id}-search`} className="block text-sm font-medium">
            Search the catalogue
          </label>
          <div className="relative mt-1.5">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              ref={searchRef}
              id={`${id}-search`}
              type="search"
              value={query}
              autoComplete="off"
              placeholder="dialog, upload, table…"
              aria-describedby={`${id}-hint`}
              onChange={(event) => {
                setQuery(event.target.value);
                setExpanded(false);
              }}
              className="min-h-11 w-full rounded-full border border-rule-strong bg-paper pr-3 pl-9 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board"
            />
          </div>
          <p id={`${id}-hint`} className="mt-1 font-mono text-xs text-ink-muted">
            Name, pattern or what it does. Press <kbd className="rounded border border-rule px-1">/</kbd> to jump here.
          </p>
        </div>

        <fieldset>
          <legend className="sr-only">Show parts of type</legend>
          <div className="flex flex-wrap gap-2">
            {choices.map((choice) => (
              <label key={choice.name} className={choice.count === 0 ? "cursor-not-allowed opacity-50" : "cursor-pointer"}>
                <input
                  type="radio"
                  name="catalogue-filter"
                  value={choice.name}
                  checked={filter === choice.name}
                  disabled={choice.count === 0 && filter !== choice.name}
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
      </div>

      {/* One line, said politely, so a screen reader hears the result of filtering or typing. */}
      <p role="status" className="mt-4 text-sm text-ink-muted">
        {matching.length === 0
          ? "Nothing matches. Try a shorter word, or clear the search."
          : `${matching.length} ${matching.length === 1 ? "part" : "parts"}${searching ? ` matching “${query.trim()}”` : filter === ALL ? "" : ` in ${filter.toLowerCase()}`}`}
      </p>

      {matching.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-rule-strong p-8 text-center">
          <p className="font-medium">No part by that name yet</p>
          <p className="mt-1 text-sm text-ink-muted">
            Every part is listed above, so a word from its name or its job will find it.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFilter(ALL);
              searchRef.current?.focus();
            }}
            className="mt-4 inline-flex min-h-11 cursor-pointer items-center rounded-full border border-rule-strong px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board"
          >
            Clear the search
          </button>
        </div>
      ) : (
        <ul id="catalogue-list" className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((part) => {
            const inStock = part.status === "in-stock";
            const how = demos[part.slug]?.how;
            return (
              <li
                key={part.slug}
                style={{ ["--part-accent" as string]: part.accent }}
                onPointerEnter={(event) => {
                  // Touch has no hover: a tap should open the part, not park a preview over it.
                  if (event.pointerType === "mouse" && inStock) setShowing(part.slug);
                }}
                onPointerLeave={() => setShowing((current) => (current === part.slug ? null : current))}
                onFocus={() => inStock && setShowing(part.slug)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                    setShowing((current) => (current === part.slug ? null : current));
                  }
                }}
                className={`group relative flex flex-col rounded-lg border border-rule bg-paper p-4 outline-offset-2 outline-board has-[a:focus-visible]:outline-2 ${inStock ? "transition-[border-color,box-shadow] hover:border-(--part-accent) hover:shadow-md" : "opacity-70"}`}
              >
                <span aria-hidden="true" className="absolute inset-x-4 top-0 h-0.5 rounded-b bg-(--part-accent)" />
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-lg leading-tight font-semibold">
                    {inStock ? (
                      <Link
                        href={`/${part.slug}`}
                        className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none"
                      >
                        {part.name}
                      </Link>
                    ) : (
                      part.name
                    )}
                  </h3>
                  <span className="font-mono text-[0.6875rem] text-ink-muted uppercase">{part.category}</span>
                </div>
                <p className="mt-1.5 font-mono text-xs text-ink-muted">{part.pattern}</p>
                <p className="mt-1 line-clamp-2 text-sm text-pretty text-ink-muted">{part.summary}</p>
                {/* The preview is a picture-in-words for anyone not using a pointer: the panel itself is
                    inert, so the frame inside it is never a focus trap. */}
                {how && <p className="sr-only">{how}</p>}
                {!inStock && <p className="mt-2 font-mono text-xs text-ink-muted uppercase">Coming soon</p>}

                {showing === part.slug && (
                  <div
                    inert
                    className="absolute -inset-x-2 -top-2 z-30 flex flex-col overflow-hidden rounded-xl border border-(--part-accent) bg-paper shadow-2xl"
                  >
                    <p className="flex items-baseline justify-between gap-2 px-4 pt-3 font-display text-lg leading-tight font-semibold">
                      {part.name}
                      <span className="font-mono text-[0.6875rem] text-ink-muted normal-case">Live preview</span>
                    </p>
                    <div className="mt-3 h-52 overflow-hidden border-y border-rule bg-white">
                      {/* Scaled down so a full-size component fits the card; it is the real exported
                          React output, running its own demo. */}
                      <iframe
                        src={`/preview/${part.slug}?demo=1`}
                        title={`${part.name} preview`}
                        loading="lazy"
                        tabIndex={-1}
                        className="h-[130%] w-[130%] origin-top-left scale-[0.77] border-0"
                      />
                    </div>
                    <p className="px-4 py-3 text-sm text-pretty text-ink-muted">{how ?? part.summary}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {collapsible && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-5 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-rule-strong px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board"
        >
          {`Show all ${matching.length} parts`}
        </button>
      )}
    </div>
  );
}
