"use client";

import Link from "next/link";
import { memo, type ReactNode, useDeferredValue, useEffect, useId, useMemo, useRef, useState, ViewTransition } from "react";
import { flushSync } from "react-dom";
import { PartDrawing } from "@/components/part-drawing";
import { categories, groups, type Part } from "@/lib/parts";

const ALL = "All";
/** How many parts "All" shows before the rest are asked for: two rows on a wide screen. */
const PREVIEW = 8;
/** Words people try first, and the ones a search by name alone used to miss. */
const SUGGESTIONS = ["calendar", "popup", "loader", "navbar", "stars"];

const words = (query: string) => query.toLowerCase().split(/\s+/).filter(Boolean);

/**
 * Matches a part on anything a person might type: its name, what it does, its pattern, its type or
 * group, its URL, or another word for it. When only another word matched, `via` says which, so the
 * card can say why it is there ("also called 'popup'").
 */
export function match(part: Part, query: string): { hit: boolean; via?: string } {
  const own = `${part.name} ${part.summary} ${part.pattern} ${part.category} ${part.group} ${part.slug}`.toLowerCase();
  let via: string | undefined;
  for (const word of words(query)) {
    if (own.includes(word)) continue;
    const other = part.aka.find((name) => name.toLowerCase().includes(word));
    if (!other) return { hit: false };
    via ??= other;
  }
  return { hit: true, via };
}

/** Marks the words that matched inside a part's name. */
function highlight(text: string, query: string): ReactNode {
  const found = words(query).map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (found.length === 0) return text;
  return text.split(new RegExp(`(${found.join("|")})`, "gi")).map((piece, index) =>
    index % 2 === 1 ? (
      <mark key={index} className="rounded-sm bg-accent/20 text-inherit">
        {piece}
      </mark>
    ) : (
      piece
    ),
  );
}

/** Filtering glides the cards to their new places, unless motion is reduced or the browser cannot. */
function withTransition(update: () => void) {
  if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    update();
    return;
  }
  document.startViewTransition(() => flushSync(update)).ready.catch(() => {});
}

/**
 * The parts catalogue: search, then type tiles and groups inside each type, instead of one long list.
 * The filters are native radios, so arrow keys move between them and a screen reader hears the group.
 */
export function Catalogue({
  parts,
  showAll = false,
  syncUrl = false,
  initialQuery = "",
  initialFilter = ALL,
  initialGroup = ALL,
  intro,
  aside,
  browse,
}: {
  parts: Part[];
  /** On its own page every match is listed; on the home page only the first few are. */
  showAll?: boolean;
  /** Writes the search and the filters into the address bar, so a result can be sent to someone. */
  syncUrl?: boolean;
  initialQuery?: string;
  initialFilter?: string;
  initialGroup?: string;
  /** Shown above the search box: the home page puts its headline here. */
  intro?: ReactNode;
  /** Shown beside the headline and search, from wide screens up: the home page hero reel. */
  aside?: ReactNode;
  /** Between the hero and the type tiles on the home page: the heading of the catalogue part. */
  browse?: ReactNode;
}) {
  const id = useId();
  const startFilter = (categories as readonly string[]).includes(initialFilter) ? initialFilter : ALL;
  const [filter, setFilter] = useState<string>(startFilter);
  const [group, setGroup] = useState<string>(
    startFilter !== ALL && groups[startFilter as Part["category"]].includes(initialGroup) ? initialGroup : ALL,
  );
  const [query, setQuery] = useState(initialQuery);
  const searchRef = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);

  /*
   * The box shows every keystroke at once; the list follows a moment behind, and only re-renders when
   * what it shows has changed. Filtering 125 cards with their drawings on every key made typing lag.
   */
  const deferredQuery = useDeferredValue(query);
  const searching = deferredQuery.trim() !== "";
  const { hits, inFilter, matching } = useMemo(() => {
    const hits = parts
      .map((part) => ({ part, ...match(part, deferredQuery) }))
      .filter((entry) => entry.hit)
      // Parts found by their own words first; those found by another name for them after.
      .sort((a, b) => Number(a.via !== undefined) - Number(b.via !== undefined));
    const inFilter = hits.filter((entry) => filter === ALL || entry.part.category === filter);
    const matching = inFilter.filter((entry) => group === ALL || entry.part.group === group);
    return { hits, inFilter, matching };
  }, [parts, deferredQuery, filter, group]);
  /*
   * The teaser on the home page shows the first few and then sends you to the catalogue page. While
   * searching it shows every match: hiding results behind a button would be odd.
   */
  const shown = useMemo(
    () => (showAll || searching || filter !== ALL ? matching : matching.slice(0, PREVIEW)),
    [showAll, searching, filter, matching],
  );
  const choices = [ALL, ...categories].map((name) => ({
    name,
    count: hits.filter((entry) => name === ALL || entry.part.category === name).length,
    // Two drawings stand for the type; the first two parts listed in it.
    drawn: name === ALL ? [] : parts.filter((part) => part.category === name).slice(0, 2),
  }));
  const groupChoices =
    filter === ALL
      ? []
      : [ALL, ...groups[filter as Part["category"]]].map((name) => ({
          name,
          count: inFilter.filter((entry) => name === ALL || entry.part.group === name).length,
        }));

  /*
   * The search and the filters go in the address bar with replaceState rather than a router push:
   * the server half of the page does not depend on them, so a navigation would only cost a round
   * trip. The point is that a filtered list can be sent to someone.
   */
  useEffect(() => {
    if (!syncUrl) return;
    const params = new URLSearchParams(window.location.search);
    const set = (key: string, value: string, empty: string) =>
      value === empty ? params.delete(key) : params.set(key, value);
    set("q", query.trim(), "");
    set("type", filter, ALL);
    set("group", group, ALL);
    const search = params.toString();
    window.history.replaceState(null, "", search === "" ? window.location.pathname : `?${search}`);
  }, [syncUrl, query, filter, group]);

  /*
   * Says when React is listening, so a test never types into a field that is still server-rendered. Set
   * on the DOM rather than kept in state: nothing about the page renders differently because of it.
   */
  useEffect(() => {
    root.current?.setAttribute("data-ready", "true");
  }, []);

  // "/" and Ctrl K (⌘K) jump to the search box, as they do in most tools — "/" never while typing.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const commandK = event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey) && !event.altKey;
      const slash = event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey;
      if (!commandK && !slash) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (slash && (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable)) return;
      event.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.select();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function chooseFilter(name: string) {
    withTransition(() => {
      setFilter(name);
      setGroup(ALL);
    });
  }

  function clearAll() {
    setQuery("");
    setFilter(ALL);
    setGroup(ALL);
    searchRef.current?.focus();
  }

  const search = (
    <div className="max-w-3xl">
    <div className="glass relative flex items-center gap-3 rounded-[1.25rem] px-5 transition-shadow focus-within:shadow-[0_0_0_6px_color-mix(in_oklab,var(--color-accent)_14%,transparent)]">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="size-5 shrink-0 text-ink-muted"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <label htmlFor={`${id}-search`} className="sr-only">
        Search the catalogue
      </label>
      <input
        ref={searchRef}
        id={`${id}-search`}
        type="search"
        value={query}
        autoComplete="off"
        placeholder={`Search ${parts.length} parts by name or what it does`}
        aria-describedby={`${id}-hint`}
        onChange={(event) => setQuery(event.target.value)}
        className="min-h-15 w-full min-w-0 bg-transparent text-lg placeholder:text-ink-muted focus-visible:outline-none sm:text-xl"
      />
      <kbd className="hidden shrink-0 rounded-md border border-rule-strong px-2 py-0.5 font-mono text-xs text-ink-muted sm:block">
        /
      </kbd>
    </div>
    <p id={`${id}-hint`} className={`mt-3 flex flex-wrap items-center gap-2 text-sm text-ink-muted`}>
      <span className="sr-only">Search by name, by what it does, or by another word for it. Press slash or Control K to jump here.</span>
      <span aria-hidden="true">Try</span>
      {SUGGESTIONS.map((word) => (
        <button
          key={word}
          type="button"
          onClick={() => {
            setQuery(word);
            searchRef.current?.focus();
          }}
          className="glass inline-flex min-h-8 cursor-pointer items-center rounded-full px-3 font-mono text-xs text-ink transition-colors hover:border-accent"
        >
          {word}
        </button>
      ))}
    </p>
    </div>
  );

  return (
    <div ref={root}>
      {aside ? (
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
          <div>
            {intro}
            <div className="mt-10">{search}</div>
          </div>
          {aside}
        </div>
      ) : (
        <>
          {intro}
          {search}
        </>
      )}

      {browse}

      <fieldset className={browse ? "mt-8" : "mt-10"}>
        <legend className="sr-only">Show parts of type</legend>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))]">
          {choices.map((choice) => (
            <label
              key={choice.name}
              className={`drawing-host glass spot flex min-h-11 flex-col rounded-2xl px-3.5 py-2.5 transition-[translate,scale,border-color,box-shadow] duration-500 ease-spring has-checked:border-accent has-checked:shadow-[inset_0_0_0_1px_var(--color-accent)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
                choice.count === 0 && filter !== choice.name
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer hover:-translate-y-0.5 active:scale-[0.96]"
              }`}
            >
              <input
                type="radio"
                name={`${id}-filter`}
                value={choice.name}
                checked={filter === choice.name}
                disabled={choice.count === 0 && filter !== choice.name}
                onChange={() => chooseFilter(choice.name)}
                className="sr-only"
              />
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold">{choice.name}</span>{" "}
                <span className="font-display text-3xl leading-none">{choice.count}</span>
              </span>
              {/* While searching the tiles shrink to their names, so the results come up to the box. */}
              {!searching && (
                <span aria-hidden="true" className="mt-2 grid grid-cols-2 gap-1.5 max-sm:hidden">
                  {choice.drawn.length === 0 ? (
                    <span className="col-span-2 self-end font-mono text-xs text-ink-muted">every part</span>
                  ) : (
                    choice.drawn.map((part) => (
                      <span
                        key={part.slug}
                        className="rounded-lg bg-[color-mix(in_oklab,var(--part-accent)_24%,transparent)] px-1 py-0.5"
                        style={{ ["--part-accent" as string]: part.accent }}
                      >
                        <PartDrawing slug={part.slug} accent={part.accent} />
                      </span>
                    ))
                  )}
                </span>
              )}
            </label>
          ))}
        </div>
      </fieldset>

      {groupChoices.length > 0 && (
        <fieldset className="mt-4">
          <legend className="sr-only">{`Narrow ${filter.toLowerCase()}`}</legend>
          <div className="flex flex-wrap items-center gap-2">
            <span aria-hidden="true" className="mr-1 text-sm text-ink-muted">
              Narrow:
            </span>
            {groupChoices.map((choice) => (
              <label key={choice.name} className={choice.count === 0 ? "cursor-not-allowed opacity-50" : "cursor-pointer"}>
                <input
                  type="radio"
                  name={`${id}-group`}
                  value={`group: ${choice.name}`}
                  checked={group === choice.name}
                  disabled={choice.count === 0 && group !== choice.name}
                  onChange={() => withTransition(() => setGroup(choice.name))}
                  className="peer sr-only"
                />
                <span className="glass inline-flex min-h-9 items-center gap-2 rounded-full px-3.5 text-sm font-medium text-ink-muted transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent hover:text-ink peer-checked:hover:text-paper">
                  {choice.name === ALL ? `All ${filter.toLowerCase()}` : choice.name}{" "}
                  <span className="font-mono text-xs opacity-80">{choice.count}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* One line, said politely, so a screen reader hears the result of filtering or typing. */}
      <p role="status" className="mt-6 text-sm text-ink-muted">
        {matching.length === 0
          ? "Nothing matches. Try a shorter word, or clear the search."
          : `${matching.length} ${matching.length === 1 ? "part" : "parts"}${searching ? ` matching “${query.trim()}”` : filter === ALL ? "" : ` in ${(group === ALL ? filter : group).toLowerCase()}`}`}
      </p>

      {matching.length === 0 ? (
        <div className="glass mt-4 rounded-2xl p-8 text-center">
          <p className="font-medium">No part by that name yet</p>
          <p className="mt-1 text-sm text-ink-muted">
            Every part is listed above, so a word from its name or its job will find it.
          </p>
          <button type="button" onClick={clearAll} className="btn-glass mt-4 cursor-pointer text-sm">
            Clear the search
          </button>
        </div>
      ) : (
        <CardList shown={shown} query={deferredQuery} />
      )}
    </div>
  );
}

/** The cards. Memoised, so a keystroke that has not changed the results does not redraw 125 of them. */
const CardList = memo(function CardList({ shown, query }: { shown: { part: Part; via?: string }[]; query: string }) {
  return (
    <ul id="catalogue-list" className="grid-gap mt-4 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {shown.map(({ part, via }) => {
        const inStock = part.status === "in-stock";
        return (
          <li
            key={part.slug}
            style={{ ["--part-accent" as string]: part.accent, viewTransitionName: `part-${part.slug}` }}
            className={`drawing-host glass spot group relative flex flex-col rounded-2xl p-2 outline-offset-3 outline-accent has-[a:focus-visible]:outline-2 ${inStock ? "transition-[translate,scale,box-shadow] duration-500 ease-spring hover:-translate-y-1 active:scale-[0.97]" : "opacity-70"}`}
          >
            {/* The drawing plays while the card is pointed at or focused, and morphs into the part page when
                the card is opened (the same name is on the drawing in components/part-header.tsx). */}
            <ViewTransition name={`drawing-${part.slug}`} share="morph" default="none">
              <div className="rounded-xl bg-[color-mix(in_oklab,var(--part-accent)_22%,transparent)] px-4 py-3 text-ink">
                <PartDrawing slug={part.slug} accent={part.accent} className="mx-auto h-28 w-auto" />
              </div>
            </ViewTransition>
            <div className="flex flex-1 flex-col px-2 pt-3 pb-1.5">
              <h3 className="text-base leading-snug font-semibold">
                {inStock ? (
                  <Link
                    href={`/${part.slug}`}
                    className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none"
                  >
                    {highlight(part.name, query)}
                  </Link>
                ) : (
                  part.name
                )}
              </h3>
              <p className="mt-0.5 font-mono text-xs text-ink-muted">
                {part.category} · {part.group}
              </p>
              {via && <p className="mt-1 font-mono text-xs text-link">{`also called “${via}”`}</p>}
              <p className="mt-2 line-clamp-2 text-sm text-pretty text-ink-muted">{part.summary}</p>
            </div>
            {!inStock && <p className="mt-2 px-2 font-mono text-xs text-ink-muted uppercase">Coming soon</p>}
          </li>
        );
      })}
    </ul>
  );
});
