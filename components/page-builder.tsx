"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type DragEvent } from "react";
import { match } from "@/components/catalogue";
import { OptionsPanel } from "@/components/options-panel";
import { Segmented } from "@/components/segmented";
import { checkPage, PageFields, type Check } from "@/components/template-editor";
import {
  blankPage,
  decodePage,
  encodePage,
  fromTemplate,
  inOrder,
  MAX_SECTIONS,
  newSection,
  pageTemplate,
  regionOf,
  type BuiltPage,
} from "@/lib/page-builder";
import { categories, inStock, partBySlug } from "@/lib/parts";
import { registry, type RegistrySlug } from "@/lib/registry";
import { templateReactSource } from "@/lib/template-output";
import { defaultOptions, templateById, templates } from "@/lib/templates";

/*
 * The page builder (D80): parts from the catalogue, dragged (or added with a button) onto a page, put in
 * order, each set up with its own options, the whole page given a name, a colour and a theme. It keeps
 * the page in this browser and as a link, and gives it back as a Next.js project, one HTML file, or a
 * shadcn install. Every drag has a button that does the same, so it all works from the keyboard.
 */

const STORAGE_KEY = "built-page";
const subscribeNever = () => () => {};

/** A link (shared, or from a template) first, then the page this browser kept. */
function initialPage(): BuiltPage {
  const shared = new URLSearchParams(window.location.hash.slice(1)).get("p");
  const fromLink = shared ? decodePage(shared) : null;
  if (fromLink) return fromLink;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const page = saved ? decodePage(saved) : null;
    if (page) return page;
  } catch {
    // Storage blocked: start fresh.
  }
  return blankPage();
}

/** The builder reads the address and storage, so it only ever renders in the browser. */
export function PageBuilder({ exportNames }: { exportNames: Record<string, string> }) {
  const inBrowser = useSyncExternalStore(subscribeNever, () => true, () => false);
  if (!inBrowser) return <p className="page-wrap py-20 text-ink-muted">Opening the builder…</p>;
  return <Builder exportNames={exportNames} />;
}

type Drag = { slug: RegistrySlug; from: "catalogue" | "page" };

function Builder({ exportNames }: { exportNames: Record<string, string> }) {
  const uid = useId();
  const [page, setPage] = useState(initialPage);
  const [selected, setSelected] = useState<RegistrySlug | null>(() => page.sections.find((s) => regionOf(s.slug) === "main")?.slug ?? null);
  const [query, setQuery] = useState("");
  const [start, setStart] = useState("");
  const [dropAt, setDropAt] = useState<number | null>(null);
  const [said, setSaid] = useState("");
  const [width, setWidth] = useState("100%");
  const [xray, setXray] = useState(false);
  const [height, setHeight] = useState(900);
  const [checks, setChecks] = useState<Check[]>([]);
  const [codeTab, setCodeTab] = useState<"install" | "page">("install");
  const [copied, setCopied] = useState("");
  const drag = useRef<Drag | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  // Where focus goes after a change moves or removes the control that had it; moved after the commit.
  const focusNext = useRef<string | null>(null);

  const sections = page.sections;
  const onPage = new Set(sections.map((section) => section.slug));
  const encoded = encodePage(page);
  const { template, options } = pageTemplate(page);
  const origin = window.location.origin;
  const found = inStock.filter((part) => part.slug in registry && match(part, query).hit);

  // The address said where to start; from here on the page lives in this browser.
  useEffect(() => {
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, encoded);
    } catch {
      // Storage blocked: the page still travels as a link.
    }
  }, [encoded]);

  useEffect(() => {
    if (!focusNext.current) return;
    document.getElementById(focusNext.current)?.focus();
    focusNext.current = null;
  });

  // The frame takes the page by message, and says when it is ready for the first one.
  useEffect(() => {
    const send = () => frameRef.current?.contentWindow?.postMessage({ type: "built-page", state: page, xray }, window.location.origin);
    send();
    function onMessage(event: MessageEvent) {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type === "template-ready") send();
      if (event.data?.type === "template-height") setHeight(Math.max(480, event.data.height));
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [page, xray]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const doc = frameRef.current?.contentDocument;
      if (doc?.body && sections.length > 0) setChecks(checkPage(doc, page));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [page, sections.length, height, width]);

  const name = (slug: string) => partBySlug(slug).name;
  const rowId = (slug: string, what: string) => `${uid}-${slug}-${what}`;

  /** Puts a part at a place in the list as shown: adds it, or moves it there if it is already on. */
  function put(slug: RegistrySlug, at: number) {
    const from = sections.findIndex((section) => section.slug === slug);
    if (from === -1 && sections.length >= MAX_SECTIONS) {
      setSaid(`A page holds ${MAX_SECTIONS} parts at most`);
      return;
    }
    const rest = sections.filter((section) => section.slug !== slug);
    rest.splice(from !== -1 && from < at ? at - 1 : at, 0, from === -1 ? newSection(slug) : sections[from]);
    const next = inOrder(rest);
    setPage({ ...page, sections: next });
    const position = `${next.findIndex((section) => section.slug === slug) + 1} of ${next.length}`;
    setSaid(from === -1 ? `Added ${name(slug)}, ${position}` : `Moved ${name(slug)} to ${position}`);
    if (from === -1) setSelected(slug);
  }

  function move(slug: RegistrySlug, by: -1 | 1) {
    const from = sections.findIndex((section) => section.slug === slug);
    const to = from + by;
    // Only within main: the banner stays first and the footer last.
    if (to < 0 || to >= sections.length || regionOf(sections[to].slug) !== "main") {
      setSaid(`${name(slug)} is already ${by < 0 ? "first" : "last"}`);
      return;
    }
    const next = [...sections];
    [next[from], next[to]] = [next[to], next[from]];
    setPage({ ...page, sections: next });
    setSaid(`Moved ${name(slug)} ${by < 0 ? "up" : "down"}, ${to + 1} of ${next.length}`);
    focusNext.current = rowId(slug, by < 0 ? "up" : "down");
  }

  function remove(slug: RegistrySlug) {
    const from = sections.findIndex((section) => section.slug === slug);
    const next = sections.filter((section) => section.slug !== slug);
    setPage({ ...page, sections: next });
    setSaid(`Removed ${name(slug)}`);
    if (selected === slug) setSelected(null);
    const neighbour = next[Math.min(from, next.length - 1)];
    focusNext.current = neighbour ? rowId(neighbour.slug, "remove") : `${uid}-search`;
  }

  function setOption(slug: RegistrySlug, patch: Record<string, unknown> | null) {
    setPage({
      ...page,
      sections: sections.map((section) =>
        section.slug === slug ? { ...section, config: patch ? { ...section.config, ...patch } : newSection(slug).config } : section,
      ),
    });
  }

  function startFrom(choice: string) {
    if (sections.length > 0 && !window.confirm("Replace the page you have with this one?")) return;
    const chosen = templateById(choice);
    const next = chosen ? fromTemplate(chosen, { ...defaultOptions(chosen), name: page.name, brand: page.brand, theme: page.theme }) : { ...page, sections: [] };
    setPage(next);
    setSelected(next.sections.find((section) => regionOf(section.slug) === "main")?.slug ?? null);
    setSaid(chosen ? `Started from the ${chosen.name.toLowerCase()} template` : "Cleared the page");
  }

  /** Where a drop would land: before the first row whose middle is below the pointer. */
  function dropIndex(clientY: number) {
    const rows = [...(listRef.current?.querySelectorAll<HTMLElement>(":scope > li") ?? [])];
    const index = rows.findIndex((row) => {
      const box = row.getBoundingClientRect();
      return clientY < box.top + box.height / 2;
    });
    return index === -1 ? rows.length : index;
  }

  const dragProps = (slug: RegistrySlug, from: Drag["from"]) => ({
    draggable: true,
    onDragStart: (event: DragEvent) => {
      drag.current = { slug, from };
      event.dataTransfer.effectAllowed = from === "catalogue" ? "copy" : "move";
      event.dataTransfer.setData("text/plain", name(slug));
    },
    onDragEnd: () => {
      drag.current = null;
      setDropAt(null);
    },
  });

  const dropProps = {
    onDragOver: (event: DragEvent) => {
      if (!drag.current) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = drag.current.from === "catalogue" ? "copy" : "move";
      const at = dropIndex(event.clientY);
      if (at !== dropAt) setDropAt(at);
    },
    onDragLeave: (event: DragEvent) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropAt(null);
    },
    onDrop: (event: DragEvent) => {
      event.preventDefault();
      if (drag.current) put(drag.current.slug, dropIndex(event.clientY));
      drag.current = null;
      setDropAt(null);
    },
  };

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
    } catch {
      setCopied("Copying is blocked here: select the text instead");
    }
    window.setTimeout(() => setCopied(""), 2500);
  }

  const install = `npx shadcn@latest add "${origin}/r/pages/${template.id}.json?p=${encoded}"`;
  const code = codeTab === "install" ? install : templateReactSource(template, options, exportNames);
  const chosen = selected ? sections.find((section) => section.slug === selected) : undefined;

  return (
    <div className="page-wrap grid grid-cols-[minmax(0,1fr)] gap-8 pt-8 pb-[clamp(4rem,9vw,8rem)] lg:grid-cols-[21rem_minmax(0,1fr)] lg:gap-10">
      <p role="status" className="sr-only">
        {said}
      </p>

      <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-6 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-auto lg:pb-1">
        <form onSubmit={(event) => event.preventDefault()} className="glass grid grid-cols-[minmax(0,1fr)] content-start gap-5 rounded-2xl p-6">
          <h2 className="font-display text-3xl leading-none">The page</h2>
          <PageFields options={page} onChange={(patch) => setPage({ ...page, ...patch })} />
          <div className="grid grid-cols-[minmax(0,1fr)] gap-1.5 text-sm font-medium">
            <label htmlFor={`${uid}-start`}>Start from</label>
            <div className="flex gap-2">
              <select
                id={`${uid}-start`}
                value={start}
                onChange={(event) => setStart(event.target.value)}
                className="min-h-11 min-w-0 flex-1 rounded-lg border border-rule-strong bg-paper px-2 text-base font-normal"
              >
                <option value="">Choose…</option>
                <option value="blank">An empty page</option>
                {templates.map((option) => (
                  <option key={option.id} value={option.id}>
                    {`${option.name} template`}
                  </option>
                ))}
              </select>
              <button type="button" disabled={!start} onClick={() => startFrom(start)} className="btn-glass cursor-pointer text-sm disabled:cursor-not-allowed disabled:opacity-60">
                Start
              </button>
            </div>
          </div>
        </form>

        <section aria-labelledby={`${uid}-parts`} className="glass rounded-2xl p-6">
          <h2 id={`${uid}-parts`} className="font-display text-3xl leading-none">
            Parts
          </h2>
          <p className="mt-2 text-sm text-ink-muted">Drag one onto your page, or add it.</p>
          <label htmlFor={`${uid}-search`} className="sr-only">
            Search the parts
          </label>
          <input
            id={`${uid}-search`}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search: faq, pricing, form…"
            className="mt-3 min-h-11 w-full rounded-lg border border-rule-strong bg-paper px-3 text-base"
          />
          {/* On a phone the list scrolls inside itself, so the page under it is not 125 rows away. */}
          <div className="-mx-2 mt-3 grid max-h-[55vh] gap-4 overflow-y-auto px-2 lg:mx-0 lg:max-h-none lg:overflow-visible lg:px-0">
            {categories.map((category) => {
              const inCategory = found.filter((part) => part.category === category);
              if (inCategory.length === 0) return null;
              return (
                <div key={category}>
                  <h3 className="font-mono text-xs tracking-wide text-ink-muted uppercase">{category}</h3>
                  <ul className="mt-1.5 grid gap-1">
                    {inCategory.map((part) => {
                      const slug = part.slug as RegistrySlug;
                      const added = onPage.has(slug);
                      return (
                        <li
                          key={slug}
                          {...dragProps(slug, "catalogue")}
                          className="flex cursor-grab items-center gap-2 rounded-lg py-1 pr-1 pl-2.5 transition-colors hover:bg-wash active:cursor-grabbing"
                        >
                          <span className="min-w-0 flex-1 text-sm">{part.name}</span>
                          <button
                            type="button"
                            aria-label={added ? `${part.name} added` : `Add ${part.name}`}
                            aria-disabled={added}
                            onClick={() => (added ? setSaid(`${part.name} is already on the page`) : put(slug, sections.length))}
                            className="min-h-9 shrink-0 cursor-pointer rounded-full border border-rule-strong px-3 text-xs font-semibold transition-colors hover:bg-ink hover:text-paper aria-disabled:cursor-default aria-disabled:border-transparent aria-disabled:font-normal aria-disabled:text-ink-muted aria-disabled:hover:bg-transparent"
                          >
                            {added ? "Added" : "Add"}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
            {found.length === 0 && <p className="text-sm text-ink-muted">{`No part matches “${query}”.`}</p>}
          </div>
        </section>
      </div>

      <div className="grid min-w-0 content-start gap-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <section aria-labelledby={`${uid}-page`} {...dropProps} className="glass self-start rounded-2xl p-6">
            <h2 id={`${uid}-page`} className="font-display text-3xl leading-none">
              Your page
            </h2>
            <p className="mt-2 text-sm text-ink-muted">Drag rows to reorder them. The header stays first and the footer last.</p>
            {sections.length === 0 ? (
              <p
                className={`mt-4 grid min-h-32 place-items-center rounded-xl border-2 border-dashed p-4 text-center text-sm text-ink-muted ${dropAt !== null ? "border-accent bg-wash" : "border-rule-strong"}`}
              >
                Drop a part here, or use Add.
              </p>
            ) : (
              <ol ref={listRef} aria-label="Parts on your page, in order" className="mt-4 grid gap-1.5">
                {sections.map((section, index) => {
                  const region = regionOf(section.slug);
                  const label = name(section.slug);
                  const line =
                    dropAt === index
                      ? "shadow-[0_-3px_0_var(--color-accent)]"
                      : dropAt === sections.length && index === sections.length - 1
                        ? "shadow-[0_3px_0_var(--color-accent)]"
                        : "";
                  return (
                    <li
                      key={section.slug}
                      {...dragProps(section.slug, "page")}
                      className={`flex items-center gap-1 rounded-xl border bg-paper py-1 pr-1 pl-1.5 ${selected === section.slug ? "border-accent" : "border-rule"} ${line}`}
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 shrink-0 cursor-grab fill-ink-muted active:cursor-grabbing">
                        {[6, 12, 18].flatMap((y) => [9, 15].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" />))}
                      </svg>
                      <button
                        type="button"
                        aria-pressed={selected === section.slug}
                        onClick={() => setSelected(section.slug)}
                        className="min-h-9 min-w-0 flex-1 cursor-pointer truncate rounded-lg px-1.5 text-left text-sm font-medium"
                      >
                        <span className="sr-only">Options for </span>
                        {label}
                      </button>
                      {region === "main" ? (
                        <>
                          <button
                            id={rowId(section.slug, "up")}
                            type="button"
                            aria-label={`Move ${label} up`}
                            onClick={() => move(section.slug, -1)}
                            className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-ink-muted hover:bg-wash hover:text-ink"
                          >
                            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
                              <path d="M12 19V5M6 11l6-6 6 6" />
                            </svg>
                          </button>
                          <button
                            id={rowId(section.slug, "down")}
                            type="button"
                            aria-label={`Move ${label} down`}
                            onClick={() => move(section.slug, 1)}
                            className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-ink-muted hover:bg-wash hover:text-ink"
                          >
                            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
                              <path d="M12 5v14M6 13l6 6 6-6" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <span className="shrink-0 px-1.5 text-xs text-ink-muted">{region === "top" ? "First" : "Last"}</span>
                      )}
                      <button
                        id={rowId(section.slug, "remove")}
                        type="button"
                        aria-label={`Remove ${label}`}
                        onClick={() => remove(section.slug)}
                        className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-ink-muted hover:bg-wash hover:text-ink"
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
                          <path d="M6 6l12 12M18 6 6 18" />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section aria-labelledby={`${uid}-options`} className="glass min-w-0 self-start rounded-2xl p-6">
            <h2 id={`${uid}-options`} className="font-display text-3xl leading-none">
              {chosen ? name(chosen.slug) : "Options"}
            </h2>
            {chosen ? (
              <div className="mt-4">
                <OptionsPanel
                  key={chosen.slug}
                  // The page's colour and theme are every part's, so they are set once, for the page.
                  schema={registry[chosen.slug].schema.filter((option) => option.key !== "accentColor" && option.key !== "theme")}
                  config={chosen.config}
                  onChange={(key, value) => setOption(chosen.slug, { [key]: value })}
                  onResetAll={() => setOption(chosen.slug, null)}
                />
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">Choose a part on your page to set it up.</p>
            )}
          </section>
        </div>

        <section aria-labelledby={`${uid}-preview`} className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id={`${uid}-preview`} className="font-display text-3xl leading-none">
              Preview
            </h2>
            <div className="flex flex-wrap items-end gap-4">
              <Segmented
                name={`${uid}-width`}
                legend="Screen width"
                value={width}
                choices={[
                  { value: "300px", label: "300" },
                  { value: "375px", label: "Phone" },
                  { value: "768px", label: "Tablet" },
                  { value: "100%", label: "Full" },
                ]}
                onChange={setWidth}
              />
              <label className="glass flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-medium">
                <input type="checkbox" checked={xray} onChange={(event) => setXray(event.target.checked)} className="size-4 accent-(--color-accent)" />
                X-ray
              </label>
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-rule bg-white shadow-[0_30px_60px_-30px_var(--color-shadow)]">
            <iframe
              ref={frameRef}
              title="Your page, React output"
              src="/preview-page"
              style={{ width, height: `min(80vh, ${height}px)`, maxWidth: "100%" }}
              className="mx-auto block border-0 transition-[width] duration-500 ease-spring"
            />
          </div>
          {sections.length > 0 && (
            <ul aria-label="Page checks" className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              {checks.map((check) => (
                <li key={check.text} className="flex gap-2.5">
                  <span
                    className={`shrink-0 self-start rounded border-2 px-1.5 font-mono text-[0.6875rem] font-bold tracking-wider uppercase ${check.ok ? "border-pass text-pass" : "border-accent text-link"}`}
                  >
                    {check.ok ? "Pass" : "Look"}
                  </span>
                  {check.text}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby={`${uid}-take`} className="glass min-w-0 rounded-2xl p-6">
          <h2 id={`${uid}-take`} className="font-display text-3xl leading-none">
            Take it home
          </h2>
          {sections.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">Add a part first.</p>
          ) : (
            <>
              <p className="mt-3 flex flex-wrap gap-2">
                <a href={`/download/${template.id}.zip?p=${encoded}`} download className="btn-accent text-sm">
                  Download a Next.js project
                </a>
                <a href={`/download/${template.id}.html?p=${encoded}`} download className="btn-glass text-sm">
                  Download one HTML file
                </a>
                <button type="button" onClick={() => copy(`${origin}/build#p=${encoded}`, "Link copied")} className="btn-glass cursor-pointer text-sm">
                  Copy a link to this page
                </button>
              </p>
              <p className="mt-2 text-xs text-ink-muted">
                The Next.js project runs as it is: npm install, then npm run dev. The link holds the whole page, so
                anyone with it can open it here.
              </p>
              <div className="mt-6">
                <Segmented
                  name={`${uid}-code`}
                  legend="Or install into your own project"
                  value={codeTab}
                  choices={[
                    { value: "install", label: "shadcn" },
                    { value: "page", label: "page.tsx" },
                  ]}
                  onChange={(value) => setCodeTab(value as typeof codeTab)}
                />
                <pre
                  tabIndex={0}
                  aria-label="Code, scrollable"
                  className="mt-3 max-h-72 overflow-auto rounded-xl bg-[#1c1a17] p-4 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap text-[#f1ede6]"
                >
                  <code>{code}</code>
                </pre>
                <p className="mt-3 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => copy(code, "Copied")} className="btn-glass cursor-pointer text-sm">
                    Copy
                  </button>
                </p>
              </div>
            </>
          )}
          <p role="status" className="mt-2 text-sm text-ink-muted">
            {copied}
          </p>
        </section>
      </div>
    </div>
  );
}
