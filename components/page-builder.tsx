"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from "react";
import { match } from "@/components/catalogue";
import { OptionsPanel } from "@/components/options-panel";
import { PartDrawing } from "@/components/part-drawing";
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
import { inStock, partBySlug, type Category } from "@/lib/parts";
import { registry, type RegistrySlug } from "@/lib/registry";
import { templateReactSource } from "@/lib/template-output";
import { defaultOptions, templateById, templates } from "@/lib/templates";

/*
 * The page builder (D80, reworked in D83). Three panes: the parts, with a drawing of each, on the left;
 * the page itself in the middle, as large as the screen allows; its layers and the chosen section's
 * options on the right. A part is dropped straight onto the page (a line shows where it will land), or
 * clicked to go below the chosen section. Sections are chosen by clicking them on the page, and moved or
 * removed there or in the layers list.
 *
 * Dragging is done with pointer events, not HTML drag and drop: that never reaches into the page's frame,
 * and does nothing on a touch screen. Every drag has a button that does the same, for the keyboard.
 */

const STORAGE_KEY = "built-page";
const subscribeNever = () => () => {};
/** Page sections first: they are what a page is made of. */
const order: Category[] = ["Page sections", "Content", "Navigation", "Feedback", "Inputs", "Overlays"];

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
  if (!inBrowser) return <p className="px-4 py-20 text-ink-muted">Opening the builder…</p>;
  return <Builder exportNames={exportNames} />;
}

type Box = { slug: RegistrySlug; top: number; height: number };
type Drop = { where: "page" | "layers"; index: number; y: number };

function Builder({ exportNames }: { exportNames: Record<string, string> }) {
  const uid = useId();
  const [page, setPage] = useState(initialPage);
  const [selected, setSelected] = useState<RegistrySlug | null>(() => page.sections.find((s) => regionOf(s.slug) === "main")?.slug ?? null);
  const [hovered, setHovered] = useState<RegistrySlug | null>(null);
  const [query, setQuery] = useState("");
  const [start, setStart] = useState("");
  const [said, setSaid] = useState("");
  const [width, setWidth] = useState("100%");
  const [mode, setMode] = useState<"edit" | "try">("edit");
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [ghost, setGhost] = useState<{ slug: RegistrySlug; x: number; y: number } | null>(null);
  const [drop, setDrop] = useState<Drop | null>(null);
  const [frameReady, setFrameReady] = useState(0);
  const [checks, setChecks] = useState<Check[]>([]);
  const [codeTab, setCodeTab] = useState<"install" | "page">("install");
  const [copied, setCopied] = useState("");
  const frameRef = useRef<HTMLIFrameElement>(null);
  const layersRef = useRef<HTMLOListElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  // A drag that just ended must not also count as a click on what it started from.
  const justDragged = useRef(false);
  // Where focus goes after a change moves or removes the control that had it; moved after the commit.
  const focusNext = useRef<string | null>(null);

  const sections = page.sections;
  const onPage = new Set(sections.map((section) => section.slug));
  const encoded = encodePage(page);
  const { template, options } = pageTemplate(page);
  const origin = window.location.origin;
  const found = inStock.filter((part) => part.slug in registry && match(part, query).hit);
  const name = (slug: string) => partBySlug(slug).name;
  const rowId = (slug: string, what: string) => `${uid}-${slug}-${what}`;
  const chosen = selected ? sections.find((section) => section.slug === selected) : undefined;
  const passing = checks.filter((check) => check.ok).length;

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

  /** Where each section sits in the frame's window, for the outlines and for working out a drop. */
  function measure() {
    const doc = frameRef.current?.contentDocument;
    if (!doc) return;
    setBoxes(
      [...doc.querySelectorAll<HTMLElement>("[data-part]")].map((el) => {
        const box = el.getBoundingClientRect();
        return { slug: el.dataset.part as RegistrySlug, top: box.top, height: box.height };
      }),
    );
  }

  // The frame takes the page by message, says when it is ready, and tells us when it changes size.
  useEffect(() => {
    const send = () => frameRef.current?.contentWindow?.postMessage({ type: "built-page", state: page }, window.location.origin);
    send();
    const timer = window.setTimeout(measure, 120);
    function onMessage(event: MessageEvent) {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type === "template-ready") {
        send();
        setFrameReady((count) => count + 1);
      }
      if (event.data?.type === "template-height") measure();
    }
    window.addEventListener("message", onMessage);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      window.removeEventListener("resize", measure);
    };
  }, [page, width]);

  /*
   * Inside the frame: scrolling moves the outlines; pointing at a section outlines it; and, while editing,
   * a click chooses the section instead of working the part (Try it lets the parts be used).
   */
  useEffect(() => {
    const frameWindow = frameRef.current?.contentWindow;
    const doc = frameRef.current?.contentDocument;
    if (!frameWindow || !doc) return;
    let frame = 0;
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(() => ((frame = 0), measure()));
    };
    const partAt = (target: EventTarget | null) => (target as Element | null)?.closest?.<HTMLElement>("[data-part]")?.dataset.part as RegistrySlug | undefined;
    const onOver = (event: Event) => setHovered(partAt(event.target) ?? null);
    const onLeave = () => setHovered(null);
    const onClick = (event: Event) => {
      if (mode !== "edit") return;
      const slug = partAt(event.target);
      event.preventDefault();
      event.stopPropagation();
      if (slug) setSelected(slug);
    };
    frameWindow.addEventListener("scroll", onScroll, { passive: true });
    doc.addEventListener("pointerover", onOver);
    doc.documentElement.addEventListener("pointerleave", onLeave);
    doc.addEventListener("click", onClick, true);
    return () => {
      cancelAnimationFrame(frame);
      frameWindow.removeEventListener("scroll", onScroll);
      doc.removeEventListener("pointerover", onOver);
      doc.documentElement.removeEventListener("pointerleave", onLeave);
      doc.removeEventListener("click", onClick, true);
    };
  }, [mode, frameReady]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const doc = frameRef.current?.contentDocument;
      if (doc?.body && sections.length > 0) setChecks(checkPage(doc, page));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [page, sections.length, width]);

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
    setSelected(slug);
  }

  /** A click on a part adds it below the chosen section, or at the end. */
  function add(slug: RegistrySlug) {
    if (onPage.has(slug)) {
      setSelected(slug);
      setSaid(`${name(slug)} is already on the page`);
      return;
    }
    const after = selected ? sections.findIndex((section) => section.slug === selected) : -1;
    put(slug, after === -1 ? sections.length : after + 1);
  }

  function move(slug: RegistrySlug, by: -1 | 1, focus: string) {
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
    focusNext.current = focus;
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
    const picked = templateById(choice);
    const next = picked ? fromTemplate(picked, { ...defaultOptions(picked), name: page.name, brand: page.brand, theme: page.theme }) : { ...page, sections: [] };
    setPage(next);
    setSelected(next.sections.find((section) => regionOf(section.slug) === "main")?.slug ?? null);
    setSaid(picked ? `Started from the ${picked.name.toLowerCase()} template` : "Cleared the page");
    setStart("");
  }

  /** Where a part would land at this point on screen, if anywhere: on the page, or in the layers list. */
  function dropAt(x: number, y: number): Drop | null {
    const frame = frameRef.current?.getBoundingClientRect();
    if (frame && x >= frame.left && x <= frame.right && y >= frame.top && y <= frame.bottom) {
      const doc = frameRef.current?.contentDocument;
      const parts = [...(doc?.querySelectorAll<HTMLElement>("[data-part]") ?? [])].map((el) => el.getBoundingClientRect());
      const index = parts.findIndex((box) => y - frame.top < box.top + box.height / 2);
      const at = index === -1 ? parts.length : index;
      const line = at < parts.length ? parts[at].top : (parts.at(-1)?.bottom ?? 0);
      return { where: "page", index: at, y: Math.max(4, Math.min(frame.height - 4, line)) };
    }
    const list = layersRef.current;
    const box = list?.getBoundingClientRect();
    if (list && box && x >= box.left && x <= box.right && y >= box.top - 20 && y <= box.bottom + 20) {
      const rows = [...list.querySelectorAll<HTMLElement>(":scope > li")].map((row) => row.getBoundingClientRect());
      const index = rows.findIndex((row) => y < row.top + row.height / 2);
      const at = index === -1 ? rows.length : index;
      return { where: "layers", index: at, y: (at < rows.length ? rows[at].top : (rows.at(-1)?.bottom ?? box.top)) - box.top };
    }
    return null;
  }

  /**
   * Starts a drag from a part in the list or a section on the page. It only becomes a drag once the pointer
   * has moved a little, so a plain click still clicks. The pointer is captured, so the frame never swallows
   * the moves; near the frame's top or bottom edge, the page scrolls.
   */
  function startDrag(event: ReactPointerEvent<HTMLElement>, slug: RegistrySlug) {
    if (event.button !== 0) return;
    const source = event.currentTarget;
    const startX = event.clientX;
    const startY = event.clientY;
    let dragging = false;
    let last: Drop | null = null;

    function onMove(move: PointerEvent) {
      if (!dragging) {
        if (Math.hypot(move.clientX - startX, move.clientY - startY) < 6) return;
        dragging = true;
        source.setPointerCapture(move.pointerId);
        document.documentElement.classList.add("is-dragging");
      }
      setGhost({ slug, x: move.clientX, y: move.clientY });
      last = dropAt(move.clientX, move.clientY);
      setDrop(last);
      const frame = frameRef.current?.getBoundingClientRect();
      if (last?.where === "page" && frame) {
        const edge = move.clientY < frame.top + 60 ? -14 : move.clientY > frame.bottom - 60 ? 14 : 0;
        if (edge) frameRef.current?.contentWindow?.scrollBy(0, edge);
      }
      // Near the screen's own edge, the window scrolls: on a phone the page sits below the parts.
      const screenEdge = move.clientY < 48 ? -16 : move.clientY > window.innerHeight - 48 ? 16 : 0;
      if (screenEdge) window.scrollBy(0, screenEdge);
    }
    function finish(commit: boolean) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("is-dragging");
      if (dragging) {
        justDragged.current = true;
        window.setTimeout(() => (justDragged.current = false), 0);
        if (commit && last) put(slug, last.index);
      }
      setGhost(null);
      setDrop(null);
    }
    const onUp = () => finish(true);
    const onCancel = () => finish(false);
    const onKey = (key: KeyboardEvent) => key.key === "Escape" && finish(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKey);
  }

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
  const pinned = (slug: string) => regionOf(slug) !== "main";
  const outline = (slug: RegistrySlug) => boxes.find((box) => box.slug === slug);
  const chosenBox = selected ? outline(selected) : undefined;
  const hoveredBox = hovered && hovered !== selected ? outline(hovered) : undefined;
  const iconButton = "grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-ink-muted hover:bg-wash hover:text-ink";

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 px-4 pb-10 lg:h-[calc(100dvh-4.5rem)] lg:grid-cols-[17rem_minmax(0,1fr)_20rem] lg:grid-rows-[auto_minmax(0,1fr)] lg:pb-4">
      <p role="status" className="sr-only">
        {said}
      </p>

      {/* The bar: how wide, edit or try, start over, and the way out with the code. */}
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3 lg:col-span-3">
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
        <Segmented
          name={`${uid}-mode`}
          legend="Clicking the page"
          value={mode}
          choices={[
            { value: "edit", label: "Chooses a section" },
            { value: "try", label: "Uses the parts" },
          ]}
          onChange={(value) => setMode(value as typeof mode)}
        />
        <div className="grid min-w-0 max-w-full gap-1.5 text-sm font-medium">
          <label htmlFor={`${uid}-start`}>Start from</label>
          <div className="flex min-w-0 gap-2">
            <select
              id={`${uid}-start`}
              value={start}
              onChange={(event) => setStart(event.target.value)}
              className="min-h-11 w-full min-w-0 flex-1 rounded-lg border border-rule-strong bg-paper px-2 text-base font-normal"
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
        <button
          type="button"
          disabled={sections.length === 0}
          onClick={() => dialogRef.current?.showModal()}
          className="btn-accent ml-auto cursor-pointer text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          Get the code
          {sections.length > 0 && checks.length > 0 && <span className="font-normal">{` · ${passing} of ${checks.length} checks pass`}</span>}
        </button>
      </div>

      {/* The parts, page sections first, each with a drawing. Drag one onto the page, or click to add it. */}
      <section aria-labelledby={`${uid}-parts`} className="glass flex min-h-0 flex-col rounded-2xl lg:row-start-2">
        <div className="border-b border-rule p-4">
          <h2 id={`${uid}-parts`} className="font-display text-2xl leading-none">
            Add parts
          </h2>
          <p className="mt-1.5 text-xs text-ink-muted">
            {chosen ? `Drag onto the page, or click to add below ${name(chosen.slug)}.` : "Drag onto the page, or click to add."}
          </p>
          <label htmlFor={`${uid}-search`} className="sr-only">
            Search the parts
          </label>
          <input
            id={`${uid}-search`}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search: faq, pricing, hero…"
            className="mt-3 min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-3 text-base"
          />
        </div>
        <div className="grid max-h-[50vh] min-h-0 gap-5 overflow-y-auto p-4 lg:max-h-none lg:flex-1">
          {order.map((category) => {
            const inCategory = found.filter((part) => part.category === category);
            if (inCategory.length === 0) return null;
            return (
              <div key={category}>
                <h3 className="font-mono text-xs tracking-wide text-ink-muted uppercase">{category}</h3>
                <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                  {inCategory.map((part) => {
                    const slug = part.slug as RegistrySlug;
                    const added = onPage.has(slug);
                    return (
                      <li key={slug} className="relative">
                        <button
                          type="button"
                          aria-label={added ? `${part.name} added` : `Add ${part.name}`}
                          aria-disabled={added}
                          onPointerDown={(event) => event.pointerType !== "touch" && startDrag(event, slug)}
                          onClick={() => !justDragged.current && add(slug)}
                          className="drawing-host flex w-full cursor-grab flex-col gap-1.5 rounded-xl border border-rule bg-paper p-1.5 text-left transition-[border-color,translate] duration-300 select-none hover:-translate-y-0.5 hover:border-accent active:cursor-grabbing aria-disabled:opacity-55 aria-disabled:hover:translate-y-0"
                        >
                          <span
                            className="grid h-14 w-full place-items-center rounded-lg bg-[color-mix(in_oklab,var(--part-accent)_22%,transparent)] text-ink"
                            style={{ ["--part-accent" as string]: part.accent }}
                          >
                            <PartDrawing slug={slug} accent={part.accent} className="h-10 w-auto" />
                          </span>
                          <span className="line-clamp-2 px-0.5 text-xs leading-tight font-medium">{part.name}</span>
                        </button>
                        {/* On a touch screen the tile scrolls the list; this handle drags it. */}
                        <span
                          aria-hidden="true"
                          onPointerDown={(event) => startDrag(event, slug)}
                          className="absolute top-1 right-1 grid size-7 touch-none place-items-center rounded-md bg-paper/90 text-ink-muted [@media(hover:hover)]:hidden"
                        >
                          <Grip />
                        </span>
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

      {/* The page itself, with the chosen section outlined and its tools beside it. */}
      <section aria-labelledby={`${uid}-preview`} className="flex min-h-0 flex-col lg:row-start-2">
        <h2 id={`${uid}-preview`} className="sr-only">
          Your page
        </h2>
        <div className="relative h-[75vh] min-h-0 overflow-hidden rounded-2xl border border-rule bg-paper-sunk lg:h-auto lg:flex-1">
          <div className="relative mx-auto h-full max-w-full transition-[width] duration-500 ease-spring" style={{ width }}>
            <iframe ref={frameRef} title="Your page, React output" src="/preview-page" className="block h-full w-full border-0 bg-white" />

            {/* Drawn over the frame, never in the way: it only catches its own buttons. */}
            <div aria-hidden={!chosenBox} className="pointer-events-none absolute inset-0 overflow-hidden">
              {mode === "edit" && hoveredBox && (
                <div
                  className="absolute inset-x-0 border-2 border-dashed border-accent/70"
                  style={{ top: hoveredBox.top, height: hoveredBox.height }}
                >
                  <span className="absolute top-1 left-1 rounded-full bg-[#1c1a17] px-2.5 py-0.5 text-[0.6875rem] font-semibold text-white">
                    {name(hoveredBox.slug)}
                  </span>
                </div>
              )}
              {chosenBox && chosen && (
                <div className="absolute inset-x-0 border-2 border-accent" style={{ top: chosenBox.top, height: chosenBox.height }}>
                  <div
                    className="pointer-events-auto absolute right-1 flex items-center gap-0.5 rounded-xl border border-rule bg-paper p-0.5 shadow-lg"
                    style={{ top: Math.max(4, -chosenBox.top + 4) }}
                  >
                    <span className="px-2 text-xs font-semibold">{name(chosen.slug)}</span>
                    {!pinned(chosen.slug) && (
                      <>
                        <span
                          aria-hidden="true"
                          title="Drag to move"
                          onPointerDown={(event) => startDrag(event, chosen.slug)}
                          className={`${iconButton} cursor-grab touch-none active:cursor-grabbing`}
                        >
                          <Grip />
                        </span>
                        <button type="button" id={rowId(chosen.slug, "page-up")} aria-label={`Move ${name(chosen.slug)} up`} onClick={() => move(chosen.slug, -1, rowId(chosen.slug, "page-up"))} className={iconButton}>
                          <Arrow up />
                        </button>
                        <button type="button" id={rowId(chosen.slug, "page-down")} aria-label={`Move ${name(chosen.slug)} down`} onClick={() => move(chosen.slug, 1, rowId(chosen.slug, "page-down"))} className={iconButton}>
                          <Arrow />
                        </button>
                      </>
                    )}
                    <button type="button" aria-label={`Remove ${name(chosen.slug)}`} onClick={() => remove(chosen.slug)} className={iconButton}>
                      <Cross />
                    </button>
                  </div>
                </div>
              )}
              {drop?.where === "page" && (
                <div className="absolute inset-x-2 -translate-y-1/2" style={{ top: drop.y }}>
                  <div className="h-1 rounded-full bg-accent shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-accent)_20%,transparent)]" />
                  <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-on-accent">
                    Drop here
                  </span>
                </div>
              )}
            </div>

            {sections.length === 0 && !drop && (
              <div className="absolute inset-0 overflow-y-auto bg-paper p-6">
                <h3 className="font-display text-3xl leading-none">Start with a template</h3>
                <p className="mt-2 text-sm text-ink-muted">Or drag parts from the left onto this page.</p>
                <ul className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-3">
                  {templates.map((option) => (
                    <li key={option.id}>
                      <button
                        type="button"
                        onClick={() => startFrom(option.id)}
                        className="h-full w-full cursor-pointer rounded-xl border border-rule bg-paper-sunk p-4 text-left transition-[border-color,translate] duration-300 hover:-translate-y-0.5 hover:border-accent"
                      >
                        <span className="block font-semibold">{option.name}</span>
                        <span className="mt-1 block text-xs text-ink-muted">{option.summary}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Layers, then the chosen section's options, or the page's own settings. */}
      <div className="grid min-h-0 grid-cols-[minmax(0,1fr)] content-start gap-4 lg:row-start-2 lg:overflow-y-auto">
        <section aria-labelledby={`${uid}-layers`} className="glass rounded-2xl p-4">
          <h2 id={`${uid}-layers`} className="font-display text-2xl leading-none">
            Layers
          </h2>
          {sections.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">Nothing on the page yet.</p>
          ) : (
            <ol ref={layersRef} aria-label="Parts on your page, in order" className="relative mt-3 grid gap-1">
              {sections.map((section) => {
                const label = name(section.slug);
                return (
                  <li
                    key={section.slug}
                    className={`flex items-center gap-0.5 rounded-xl border bg-paper py-0.5 pr-0.5 pl-1 ${selected === section.slug ? "border-accent" : "border-rule"}`}
                  >
                    {pinned(section.slug) ? (
                      <span className="w-6 shrink-0" />
                    ) : (
                      <span aria-hidden="true" onPointerDown={(event) => startDrag(event, section.slug)} className="grid size-7 shrink-0 cursor-grab touch-none place-items-center text-ink-muted active:cursor-grabbing">
                        <Grip />
                      </span>
                    )}
                    <button
                      type="button"
                      aria-pressed={selected === section.slug}
                      onClick={() => setSelected(section.slug)}
                      className="min-h-9 min-w-0 flex-1 cursor-pointer truncate rounded-lg px-1 text-left text-sm font-medium"
                    >
                      <span className="sr-only">Options for </span>
                      {label}
                    </button>
                    {pinned(section.slug) ? (
                      <span className="shrink-0 px-1 text-xs text-ink-muted">{regionOf(section.slug) === "top" ? "First" : "Last"}</span>
                    ) : (
                      <>
                        <button type="button" id={rowId(section.slug, "up")} aria-label={`Move ${label} up`} onClick={() => move(section.slug, -1, rowId(section.slug, "up"))} className={iconButton}>
                          <Arrow up />
                        </button>
                        <button type="button" id={rowId(section.slug, "down")} aria-label={`Move ${label} down`} onClick={() => move(section.slug, 1, rowId(section.slug, "down"))} className={iconButton}>
                          <Arrow />
                        </button>
                      </>
                    )}
                    <button type="button" id={rowId(section.slug, "remove")} aria-label={`Remove ${label}`} onClick={() => remove(section.slug)} className={iconButton}>
                      <Cross />
                    </button>
                  </li>
                );
              })}
              {drop?.where === "layers" && <li aria-hidden="true" className="pointer-events-none absolute inset-x-0 h-1 -translate-y-1/2 rounded-full bg-accent" style={{ top: drop.y }} />}
            </ol>
          )}
        </section>

        {chosen ? (
          <section aria-labelledby={`${uid}-options`} className="glass min-w-0 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 id={`${uid}-options`} className="font-display text-2xl leading-none">
                {name(chosen.slug)}
              </h2>
              <button type="button" onClick={() => setSelected(null)} className="min-h-9 cursor-pointer rounded-lg px-2 text-sm text-link underline underline-offset-2">
                Page settings
              </button>
            </div>
            <div className="mt-3">
              <OptionsPanel
                key={chosen.slug}
                // The page's colour and theme are every part's, so they are set once, for the page.
                schema={registry[chosen.slug].schema.filter((option) => option.key !== "accentColor" && option.key !== "theme")}
                config={chosen.config}
                onChange={(key, value) => setOption(chosen.slug, { [key]: value })}
                onResetAll={() => setOption(chosen.slug, null)}
              />
            </div>
          </section>
        ) : (
          <form onSubmit={(event) => event.preventDefault()} className="glass grid grid-cols-[minmax(0,1fr)] content-start gap-5 rounded-2xl p-4">
            <h2 className="font-display text-2xl leading-none">Page settings</h2>
            <PageFields options={page} onChange={(patch) => setPage({ ...page, ...patch })} />
            <p className="text-xs text-ink-muted">Choose a section on the page to set it up.</p>
          </form>
        )}
      </div>

      {ghost && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[100] flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-xl border border-accent bg-paper px-3 py-2 text-sm font-semibold shadow-xl"
          style={{ left: ghost.x, top: ghost.y }}
        >
          <PartDrawing slug={ghost.slug} accent={partBySlug(ghost.slug).accent} className="h-6 w-auto" />
          {name(ghost.slug)}
        </div>
      )}

      {/* Everything to take home, in one place. */}
      <dialog ref={dialogRef} aria-labelledby={`${uid}-take`} className="m-auto w-[min(44rem,calc(100vw-2rem))] rounded-2xl border border-rule bg-paper p-0 text-ink backdrop:bg-black/40">
        <div className="grid max-h-[85vh] gap-5 overflow-y-auto p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={`${uid}-take`} className="font-display text-3xl leading-none">
              Take it home
            </h2>
            <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close" className={iconButton}>
              <Cross />
            </button>
          </div>
          <p className="flex flex-wrap gap-2">
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
          <p className="-mt-2 text-xs text-ink-muted">
            The Next.js project runs as it is: npm install, then npm run dev. The link holds the whole page, so anyone with
            it can open it here.
          </p>
          <div>
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
              className="mt-3 max-h-60 overflow-auto rounded-xl bg-[#1c1a17] p-4 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap text-[#f1ede6]"
            >
              <code>{code}</code>
            </pre>
            <p className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => copy(code, "Copied")} className="btn-glass cursor-pointer text-sm">
                Copy
              </button>
              <span role="status" className="text-sm text-ink-muted">
                {copied}
              </span>
            </p>
          </div>
          <ul aria-label="Page checks" className="grid gap-2 text-sm sm:grid-cols-2">
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
        </div>
      </dialog>
    </div>
  );
}

function Grip() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-current">
      {[6, 12, 18].flatMap((y) => [9, 15].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" />))}
    </svg>
  );
}

function Arrow({ up = false }: { up?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
      <path d={up ? "M12 19V5M6 11l6-6 6 6" : "M12 5v14M6 13l6 6 6-6"} />
    </svg>
  );
}

function Cross() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
