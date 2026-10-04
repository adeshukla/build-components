"use client";

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from "react";
import { match } from "@/components/catalogue";
import { OptionsPanel } from "@/components/options-panel";
import { PartDrawing } from "@/components/part-drawing";
import { Segmented } from "@/components/segmented";
import { checkPage, PageFields, type Check } from "@/components/template-editor";
import {
  decodePage,
  encodePage,
  fromTemplate,
  inOrder,
  MAX_SECTIONS,
  newSection,
  suggestions,
  pageTemplate,
  regionOf,
  type BuiltPage,
  type BuiltSection,
} from "@/lib/page-builder";
import { inStock, partBySlug, type Category } from "@/lib/parts";
import { registry, type RegistrySlug } from "@/lib/registry";
import { buttonShapes, colourFamilies, cornerScales, fonts, lookOf, presets, spacings, type Look, type PresetId } from "@/lib/theme";
import {
  addressFor,
  blankSite,
  decodeSite,
  encodeSite,
  fromView,
  MAX_PAGES,
  newPage,
  pageView,
  siteData,
  siteFrom,
  siteFromPage,
  siteFromStarter,
  starters,
  type BuiltSite,
} from "@/lib/site-builder";
import { ACCEPTED_PICTURES, loadPicture, pictureName, picturesIn, savePicture, swapPictures } from "@/lib/pictures";
import type { Schema } from "@/lib/schema";
import { templateReactSource } from "@/lib/template-output";
import { zipInBrowser } from "@/lib/zip-browser";
import { defaultOptions, sectionSpaces, sectionWidths, templateById, templates, type SectionSpace, type SectionWidth } from "@/lib/templates";

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

const STORAGE_KEY = "built-site";
const subscribeNever = () => () => {};
/** Page sections first: they are what a page is made of. */
const order: Category[] = ["Page sections", "Content", "Navigation", "Feedback", "Inputs", "Overlays"];

/** A link (shared, or from a template) first, then the site this browser kept, then a fresh one. */
async function initialSite(): Promise<BuiltSite> {
  const shared = new URLSearchParams(window.location.hash.slice(1)).get("p");
  const fromLink = shared ? await decodeSite(shared) : null;
  if (fromLink) return fromLink;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const site = saved ? siteFrom(JSON.parse(saved)) : null;
    if (site) return site;
    // A page kept before websites (D80–D85) carries on as a one-page site.
    const page = decodePage(localStorage.getItem("built-page") ?? "");
    if (page) return siteFromPage(page);
  } catch {
    // Storage blocked: start fresh.
  }
  return blankSite();
}

/** The builder reads the address and storage, so it only ever renders in the browser. */
export function PageBuilder({ exportNames }: { exportNames: Record<string, string> }) {
  const inBrowser = useSyncExternalStore(subscribeNever, () => true, () => false);
  if (!inBrowser) return <p className="px-4 py-20 text-ink-muted">Opening the builder…</p>;
  return <SiteLoader exportNames={exportNames} />;
}

/** A shared link is compressed, so reading it takes a moment. */
function SiteLoader({ exportNames }: { exportNames: Record<string, string> }) {
  const [site, setSite] = useState<BuiltSite | null>(null);
  useEffect(() => {
    initialSite().then(setSite);
  }, []);
  if (!site) return <p className="px-4 py-20 text-ink-muted">Opening the builder…</p>;
  return <Builder exportNames={exportNames} initialSite={site} />;
}

type Box = { slug: RegistrySlug; top: number; height: number };

/** A place in a part's options that holds a picture: an option of its own, or a field of a list's items. */
type PictureSlot = { key: string; label: string; field?: string };
const picturey = /(src|image)$/i;
function pictureSlots(schema: Schema): PictureSlot[] {
  return schema.flatMap((option): PictureSlot[] => {
    // By name: some parts mark their picture fields as addresses, some (the gallery, the logo wall) do not.
    if (option.type === "text" && picturey.test(option.key)) return [{ key: option.key, label: option.label }];
    if (option.type === "list") {
      const field = option.fields.find((candidate) => picturey.test(candidate.key));
      if (field) return [{ key: option.key, label: option.label, field: field.key }];
    }
    return [];
  });
}

/** Reads a file into a data: address, for the one-file HTML download. */
const asDataUrl = (blob: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
type Drop = { where: "page" | "layers"; index: number; y: number };

function Builder({ exportNames, initialSite }: { exportNames: Record<string, string>; initialSite: BuiltSite }) {
  const uid = useId();
  const [site, setSite] = useState(initialSite);
  const [pageId, setPageId] = useState(initialSite.pages[0].id);
  // The page being edited, as a page: the shared header, its own sections, the shared footer. Every tool
  // below works on it; setPage puts an edit back into the site (lib/site-builder.ts).
  // Memoised: effects below watch it, and a new object every render would re-run them every render.
  const page = useMemo(() => pageView(site, pageId), [site, pageId]);
  const setPage = (next: BuiltPage) => setSite(fromView(site, pageId, next));
  const current = site.pages.find((candidate) => candidate.id === pageId) ?? site.pages[0];
  const menuFollows = site.menu && site.pages.length > 1;
  // The site's link text (compressed, so it takes a moment) and the same without kept pictures.
  const [link, setLink] = useState("");
  const [installLink, setInstallLink] = useState("");
  const [selected, setSelected] = useState<RegistrySlug | null>(() => page.sections.find((s) => regionOf(s.slug) === "main")?.slug ?? null);
  const [hovered, setHovered] = useState<RegistrySlug | null>(null);
  const [query, setQuery] = useState("");
  const [start, setStart] = useState("");
  const [said, setSaid] = useState("");
  const [width, setWidth] = useState("100%");
  const [mode, setMode] = useState<"edit" | "try">("edit");
  const [previewing, setPreviewing] = useState(false);
  const [note, setNote] = useState("");
  // Pictures kept in this browser, by the address the page uses, as addresses the frame can load.
  const [shownPictures, setShownPictures] = useState<Record<string, string>>({});
  const [dropping, setDropping] = useState<RegistrySlug | null>(null);
  // Whether public/pictures-sw.js is answering for this page and its frame yet.
  const [served, setServed] = useState(false);
  const [frameAllowed, setFrameAllowed] = useState(() => !navigator.serviceWorker || Boolean(navigator.serviceWorker.controller));
  // Bumped by a click on the page's text, so the field for it is focused even if the section was chosen already.
  const [, setClicked] = useState(0);
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
  // Text clicked on the page, whose field is focused once the section's options have rendered.
  const editText = useRef<string | null>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const sections = page.sections;
  const onPage = new Set(sections.map((section) => section.slug));
  // The page alone, for "Open in a new tab".
  const encoded = encodePage(page);
  const siteName = site.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "site";
  const sitePictures = picturesIn(site);
  const { template, options } = pageTemplate(page);
  const origin = window.location.origin;
  const found = inStock.filter((part) => part.slug in registry && match(part, query).hit);
  const name = (slug: string) => partBySlug(slug).name;
  const rowId = (slug: string, what: string) => `${uid}-${slug}-${what}`;
  const chosen = selected ? sections.find((section) => section.slug === selected) : undefined;
  const chosenSlots = chosen ? pictureSlots(registry[chosen.slug].schema) : [];
  const passing = checks.filter((check) => check.ok).length;
  const suggested = suggestions(page, selected);
  const pictures = picturesIn(page);
  // The page as the frame shows it: a kept picture's address is answered by the worker; one this browser
  // does not have (a shared link), or any before the worker is answering, is left empty: a placeholder.
  const shown = swapPictures(page, (address) => (served && shownPictures[address] ? address : ""));
  // In the full-screen preview, clicks always work the parts.
  const clicks = previewing ? "try" : mode;

  // The address said where to start; from here on the page lives in this browser.
  useEffect(() => {
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(siteData(site)));
    } catch {
      // Storage blocked: the site still travels as a link.
    }
    let current = true;
    Promise.all([encodeSite(site), encodeSite(swapPictures(site, () => ""))]).then(([full, bare]) => {
      if (!current) return;
      setLink(full);
      setInstallLink(bare);
    });
    return () => {
      current = false;
    };
  }, [site]);

  useEffect(() => {
    if (focusNext.current) {
      document.getElementById(focusNext.current)?.focus();
      focusNext.current = null;
    }
    // Clicked text on the page: the field that holds it, if there is one, gets focus.
    const text = editText.current;
    if (text) {
      editText.current = null;
      const field = [...(optionsRef.current?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea") ?? [])].find(
        (input) => input.value.trim() === text,
      );
      field?.focus();
      field?.select();
    }
  });

  // The full-screen preview: Escape closes it, and nothing behind it can be reached meanwhile.
  useEffect(() => {
    if (!previewing) return;
    const behind = [...document.querySelectorAll<HTMLElement>("body > header, body > footer, body > .skip-link")];
    behind.forEach((el) => (el.inert = true));
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setPreviewing(false);
      focusNext.current = `${uid}-preview-button`;
    };
    // The frame hears Escape too (after a click in there, the keyboard is in there): see its listeners.
    document.addEventListener("keydown", onKey);
    return () => {
      behind.forEach((el) => (el.inert = false));
      document.removeEventListener("keydown", onKey);
    };
  }, [previewing, uid]);

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

  /*
   * The worker that answers kept pictures' addresses (public/pictures-sw.js). Chromium does not hand it a
   * frame that is already open, so the page's frame is only loaded once the worker is in charge: at once
   * on any visit after the first, a moment later on the first. Without workers (or if one never starts),
   * the frame loads anyway and kept pictures show as placeholders.
   */
  useEffect(() => {
    const workers = navigator.serviceWorker;
    if (!workers) return;
    const ready = () => workers.controller && setFrameAllowed(true);
    const fallback = window.setTimeout(() => setFrameAllowed(true), 3000);
    workers.addEventListener("controllerchange", ready);
    workers.register("/pictures-sw.js").then(ready, () => setFrameAllowed(true));
    return () => {
      window.clearTimeout(fallback);
      workers.removeEventListener("controllerchange", ready);
    };
  }, []);

  // Pictures the page uses that are not loaded yet: read from this browser, once each.
  const missing = pictures.filter((address) => !(address in shownPictures)).join(" ");
  useEffect(() => {
    if (!missing) return;
    let current = true;
    Promise.all(missing.split(" ").map(async (address) => [address, await loadPicture(address)] as const)).then((found) => {
      if (!current) return;
      setShownPictures((known) => ({
        ...known,
        ...Object.fromEntries(found.map(([address, blob]) => [address, blob ? URL.createObjectURL(blob) : ""])),
      }));
    });
    return () => {
      current = false;
    };
  }, [missing]);

  // The frame takes the page by message, says when it is ready, and tells us when it changes size.
  useEffect(() => {
    const send = () => frameRef.current?.contentWindow?.postMessage({ type: "built-page", state: shown }, window.location.origin);
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
    // `shown` is new every render; the page and the pictures behind it are what change it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, width, shownPictures, served]);

  /*
   * Inside the frame: scrolling moves the outlines; pointing at a section outlines it; and, while editing,
   * a click chooses the section instead of working the part (Try it lets the parts be used).
   */
  useEffect(() => {
    const frameWindow = frameRef.current?.contentWindow;
    const doc = frameRef.current?.contentDocument;
    // Mid-load the frame's document can have no root yet; this runs again once the frame says it is ready.
    if (!frameWindow || !doc?.documentElement) return;
    let frame = 0;
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(() => ((frame = 0), measure()));
    };
    const partAt = (target: EventTarget | null) => (target as Element | null)?.closest?.<HTMLElement>("[data-part]")?.dataset.part as RegistrySlug | undefined;
    const onOver = (event: Event) => setHovered(partAt(event.target) ?? null);
    const onLeave = () => setHovered(null);
    const onClick = (event: Event) => {
      const target = event.target as Element | null;
      if (clicks === "edit") {
        const slug = partAt(target);
        event.preventDefault();
        event.stopPropagation();
        if (!slug) return;
        setSelected(slug);
        const text = target?.closest("h1, h2, h3, h4, h5, h6, p, a, button, li, span, label, dt, dd")?.textContent?.trim();
        if (text && text.length <= 300) {
          editText.current = text;
          setClicked((count) => count + 1);
        }
        return;
      }
      // Trying the page: a link to another page of the site would take the frame away from it.
      const link = target?.closest?.("a[href]");
      const href = link?.getAttribute("href") ?? "";
      if (link && !href.startsWith("#")) {
        event.preventDefault();
        // One of the site's own pages: go to it, as the real site will.
        const to = site.pages.find((candidate) => candidate.path === href);
        if (to) {
          openPage(to.id);
          return;
        }
        setNote(`On your site, this goes to ${href}`);
        window.setTimeout(() => setNote(""), 2600);
      }
    };
    // A picture file dragged in from the computer: the section under it lights up, and takes it.
    const carriesFiles = (event: DragEvent) => event.dataTransfer?.types.includes("Files");
    const onFileOver = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      setDropping(partAt(event.target) ?? null);
    };
    const onFileDrop = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      setDropping(null);
      const slug = partAt(event.target);
      const file = event.dataTransfer?.files[0];
      if (slug && file) dropPicture(slug, file);
    };
    const onFileLeave = () => setDropping(null);
    // Pictures go into the page only once the worker answers for the frame itself: a picture asked for
    // before then fails, and is not asked for again.
    const workers = frameWindow.navigator.serviceWorker;
    const answered = () => setServed(Boolean(workers?.controller));
    answered();
    workers?.addEventListener("controllerchange", answered);
    // Escape closes the full-screen preview from inside the frame too. Here, not where the preview opens:
    // the frame's document can be replaced after that (its first load waits for the picture worker).
    const onKey = (event: KeyboardEvent) => {
      if (!previewing || event.key !== "Escape") return;
      setPreviewing(false);
      focusNext.current = `${uid}-preview-button`;
    };
    doc.addEventListener("keydown", onKey);
    doc.addEventListener("dragover", onFileOver);
    doc.addEventListener("drop", onFileDrop);
    doc.documentElement.addEventListener("dragleave", onFileLeave);
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
      workers?.removeEventListener("controllerchange", answered);
      doc.removeEventListener("keydown", onKey);
      doc.removeEventListener("dragover", onFileOver);
      doc.removeEventListener("drop", onFileDrop);
      doc.documentElement.removeEventListener("dragleave", onFileLeave);
    };
    // dropPicture reads the page as it is when the file lands; listeners are re-attached with every page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clicks, frameReady, page, previewing, uid]);

  // A picture dropped anywhere else in the builder is not opened by the browser in place of it.
  useEffect(() => {
    const stop = (event: DragEvent) => event.dataTransfer?.types.includes("Files") && event.preventDefault();
    window.addEventListener("dragover", stop);
    window.addEventListener("drop", stop);
    return () => {
      window.removeEventListener("dragover", stop);
      window.removeEventListener("drop", stop);
    };
  }, []);

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
    if (choice.startsWith("site:")) return startSite(choice.slice(5));
    if (current.sections.length > 0 && !window.confirm("Replace this page's sections with the template's?")) return;
    const picked = templateById(choice);
    const filled = picked ? fromTemplate(picked, { ...defaultOptions(picked), name: page.name, brand: page.brand, theme: page.theme }) : { ...page, sections: [] };
    // The site's own header and footer stay; a template's are used only if the site has none yet.
    const keep = (region: "top" | "bottom", own: BuiltSection[]) => (own.length ? own : filled.sections.filter((section) => regionOf(section.slug) === region));
    const next = {
      ...page,
      sections: [...keep("top", site.top), ...filled.sections.filter((section) => regionOf(section.slug) === "main"), ...keep("bottom", site.bottom)],
    };
    setPage(next);
    setSelected(next.sections.find((section) => regionOf(section.slug) === "main")?.slug ?? null);
    setSaid(picked ? `Started from the ${picked.name.toLowerCase()} template` : "Cleared the page");
    setStart("");
  }

  /** A whole website (D88): replaces every page, keeps the name, colour, theme and look. */
  function startSite(id: string) {
    const built = siteFromStarter(id, { name: site.name, brand: site.brand, theme: site.theme, look: site.look });
    const starter = starters.find((candidate) => candidate.id === id);
    if (!built || !starter) return;
    const anything = site.pages.length > 1 || site.pages.some((candidate) => candidate.sections.length > 0) || site.top.length + site.bottom.length > 0;
    if (anything && !window.confirm(`Replace the whole website with the ${starter.name} website's ${built.pages.length} pages?`)) return;
    setSite(built);
    setPageId(built.pages[0].id);
    setSelected(built.pages[0].sections[0]?.slug ?? null);
    setSaid(`Started the ${starter.name} website: ${built.pages.length} pages, linked from the menu`);
    setStart("");
  }

  function openPage(id: string) {
    setPageId(id);
    setSelected(null);
    const to = site.pages.find((candidate) => candidate.id === id);
    if (to) setSaid(`Now editing ${to.title}`);
  }

  function addPage() {
    if (site.pages.length >= MAX_PAGES) {
      setSaid(`A website holds ${MAX_PAGES} pages at most`);
      return;
    }
    const made = newPage(site, `Page ${site.pages.length + 1}`);
    setSite({ ...site, pages: [...site.pages, made] });
    setPageId(made.id);
    setSelected(null);
    setSaid(`Added ${made.title}. Name it in Page settings.`);
    focusNext.current = `${uid}-page-title`;
  }

  function editPage(patch: { title?: string; path?: string }) {
    setSite({ ...site, pages: site.pages.map((candidate) => (candidate.id === current.id ? { ...candidate, ...patch } : candidate)) });
  }

  function deletePage() {
    if (current.path === "/" || !window.confirm(`Delete the page ${current.title}?`)) return;
    const rest = site.pages.filter((candidate) => candidate.id !== current.id);
    setSite({ ...site, pages: rest });
    setPageId(rest[0].id);
    setSelected(null);
    setSaid(`Deleted ${current.title}`);
    focusNext.current = `${uid}-tab-${rest[0].id}`;
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

  /** Puts a picture into one slot of a section: an option of its own, or the item at `index` of a list. */
  function setPicture(slug: RegistrySlug, slot: PictureSlot, address: string, index?: number) {
    const section = sections.find((candidate) => candidate.slug === slug);
    if (!section) return;
    if (!slot.field) {
      setOption(slug, { [slot.key]: address });
      return;
    }
    const items = [...((section.config[slot.key] as Record<string, string>[]) ?? [])];
    const at = index ?? items.findIndex((item) => !item[slot.field!]);
    // A list with every picture filled grows by one: a copy of its last item, with the new picture.
    if (at === -1 || at >= items.length) items.push({ ...(items.at(-1) ?? {}), [slot.field]: address });
    else items[at] = { ...items[at], [slot.field]: address };
    setOption(slug, { [slot.key]: items });
  }

  /** A picture file for a section: kept in this browser, and put in its first empty picture slot. */
  async function dropPicture(slug: RegistrySlug, file: File) {
    const slots = pictureSlots(registry[slug].schema);
    if (slots.length === 0) {
      setNote(`${name(slug)} has no place for a picture. Hero, Split feature, Image gallery, Logo wall and Carousel do.`);
      window.setTimeout(() => setNote(""), 3500);
      return;
    }
    try {
      const address = await savePicture(file);
      const section = sections.find((candidate) => candidate.slug === slug);
      const empty = slots.find((slot) => !slot.field && !section?.config[slot.key]);
      setPicture(slug, empty ?? slots[0], address);
      setSelected(slug);
      setSaid(`Picture added to ${name(slug)}`);
    } catch (error) {
      setNote((error as Error).message);
      window.setTimeout(() => setNote(""), 4000);
    }
  }

  /** The page with each kept picture swapped for what a download carries in its place. */
  async function withPictures(to: (address: string, blob: Blob) => Promise<string> | string) {
    const found: Record<string, string> = {};
    for (const address of sitePictures) {
      const blob = await loadPicture(address);
      found[address] = blob ? await to(address, blob) : "";
    }
    return (text: string) => text.replaceAll(/https:\/\/assets\.invalid\/[a-z0-9]{16}\.\w+/g, (address) => found[address] ?? "");
  }

  function save(blob: Blob, file: string) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = file;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  /** The Next.js project with the pictures in public/images, zipped here: only this browser has them. */
  async function downloadProject() {
    const files: Record<string, string> = await (await fetch(`/download/${siteName}.json?p=${link}`)).json();
    const blobs: Record<string, Uint8Array> = {};
    const swap = await withPictures(async (address, blob) => {
      blobs[`public/images/${pictureName(address)}`] = new Uint8Array(await blob.arrayBuffer());
      return `/images/${pictureName(address)}`;
    });
    const all: Record<string, string | Uint8Array> = Object.fromEntries(Object.entries(files).map(([path, text]) => [path, swap(text)]));
    save(zipInBrowser({ ...all, ...blobs }), `${siteName}.zip`);
  }

  /**
   * The HTML: one file with the pictures inside it for a one-page site; for a website, a .zip of its pages
   * linked to one another, with the pictures in images/.
   */
  async function downloadHtml() {
    if (site.pages.length === 1) {
      const html = await (await fetch(`/download/${siteName}.html?p=${link}`)).text();
      const swap = await withPictures((_, blob) => asDataUrl(blob));
      save(new Blob([swap(html)], { type: "text/html" }), `${siteName}.html`);
      return;
    }
    const pages: Record<string, string> = await (await fetch(`/download/${siteName}-html.json?p=${link}`)).json();
    const blobs: Record<string, Uint8Array> = {};
    const swap = await withPictures(async (address, blob) => {
      blobs[`images/${pictureName(address)}`] = new Uint8Array(await blob.arrayBuffer());
      return `images/${pictureName(address)}`;
    });
    const files: Record<string, string | Uint8Array> = Object.fromEntries(Object.entries(pages).map(([file, html]) => [file, swap(html)]));
    save(zipInBrowser({ ...files, ...blobs }), `${siteName}-html.zip`);
  }

  function openPreview() {
    setPreviewing(true);
    focusNext.current = `${uid}-close-preview`;
  }
  function closePreview() {
    setPreviewing(false);
    focusNext.current = `${uid}-preview-button`;
  }

  function setLayout(slug: RegistrySlug, patch: { width?: SectionWidth; space?: SectionSpace }) {
    setPage({ ...page, sections: sections.map((section) => (section.slug === slug ? { ...section, ...patch } : section)) });
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

  const install = `npx shadcn@latest add "${origin}/r/pages/${siteName}.json?p=${installLink}"`;
  const code = codeTab === "install" ? install : templateReactSource(template, options, exportNames);
  const pinned = (slug: string) => regionOf(slug) !== "main";
  const outline = (slug: RegistrySlug) => boxes.find((box) => box.slug === slug);
  const chosenBox = selected ? outline(selected) : undefined;
  const hoveredBox = hovered && hovered !== selected ? outline(hovered) : undefined;
  const iconButton = "grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-ink-muted hover:bg-wash hover:text-ink";

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 px-4 pb-10 lg:min-h-0 lg:flex-1 lg:grid-cols-[17rem_minmax(0,1fr)_20rem] lg:grid-rows-[auto_minmax(0,1fr)] lg:pb-4">
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
          <label htmlFor={`${uid}-start`}>Fill this page from</label>
          <div className="flex min-w-0 gap-2">
            <select
              id={`${uid}-start`}
              value={start}
              onChange={(event) => setStart(event.target.value)}
              className="min-h-11 w-full min-w-0 flex-1 rounded-lg border border-rule-strong bg-paper px-2 text-base font-normal"
            >
              <option value="">Choose…</option>
              <option value="blank">An empty page</option>
              <optgroup label="This page">
                {templates.map((option) => (
                  <option key={option.id} value={option.id}>
                    {`${option.name} template`}
                  </option>
                ))}
              </optgroup>
              <optgroup label="The whole website">
                {starters.map((option) => (
                  <option key={option.id} value={`site:${option.id}`}>
                    {`${option.name} website (${option.pages.length} pages)`}
                  </option>
                ))}
              </optgroup>
            </select>
            <button type="button" disabled={!start} onClick={() => startFrom(start)} className="btn-glass cursor-pointer text-sm disabled:cursor-not-allowed disabled:opacity-60">
              Start
            </button>
          </div>
        </div>
        <button
          id={`${uid}-preview-button`}
          type="button"
          disabled={sections.length === 0}
          onClick={openPreview}
          className="btn-glass ml-auto cursor-pointer text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          Preview
        </button>
        <button
          type="button"
          disabled={sections.length === 0}
          onClick={() => dialogRef.current?.showModal()}
          className="btn-accent cursor-pointer text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          Get the code
          {sections.length > 0 && checks.length > 0 && <span className="font-normal">{` · ${passing} of ${checks.length} checks pass`}</span>}
        </button>
      </div>

      {/* The parts, page sections first, each with a drawing. Drag one onto the page, or click to add it. */}
      <section aria-labelledby={`${uid}-parts`} className="glass relative flex min-h-0 flex-col rounded-2xl lg:row-start-2">
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
        <div className="thin-scroll relative grid max-h-[50vh] min-h-0 gap-5 overflow-y-auto p-4 lg:max-h-none lg:flex-1">
          {query === "" && suggested.length > 0 && (
            <div>
              <h3 className="font-mono text-xs tracking-wide text-ink-muted uppercase">Suggested</h3>
              <ul className="mt-2 grid gap-2">
                {suggested.map((suggestion) => (
                  <li key={suggestion.slug}>
                    <button
                      type="button"
                      onClick={() => add(suggestion.slug)}
                      className="drawing-host flex w-full cursor-pointer items-center gap-3 rounded-xl border border-dashed border-rule-strong bg-paper p-1.5 text-left transition-[border-color] duration-300 hover:border-accent"
                    >
                      <span
                        className="grid h-10 w-14 shrink-0 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--part-accent)_22%,transparent)] text-ink"
                        style={{ ["--part-accent" as string]: partBySlug(suggestion.slug).accent }}
                      >
                        <PartDrawing slug={suggestion.slug} accent={partBySlug(suggestion.slug).accent} className="h-7 w-auto" />
                      </span>
                      <span className="min-w-0 text-xs leading-tight">
                        <span className="block font-medium">{name(suggestion.slug)}</span>
                        <span className="block text-ink-muted">{suggestion.why}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
      <section
        aria-labelledby={`${uid}-preview`}
        role={previewing ? "dialog" : undefined}
        aria-modal={previewing || undefined}
        className={previewing ? "fixed inset-0 z-[70] flex flex-col gap-3 bg-paper p-3" : "flex min-h-0 flex-col lg:row-start-2"}
      >
        <h2 id={`${uid}-preview`} className="sr-only">
          {previewing ? "Preview of your page" : "Your page"}
        </h2>
        {previewing && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-display text-2xl leading-none">Preview</span>
            <Segmented
              name={`${uid}-preview-width`}
              legend="Screen width"
              hideLegend
              value={width}
              choices={[
                { value: "300px", label: "300" },
                { value: "375px", label: "Phone" },
                { value: "768px", label: "Tablet" },
                { value: "100%", label: "Full" },
              ]}
              onChange={setWidth}
            />
            <a href={`/preview-page#p=${encoded}`} target="_blank" rel="noopener" className="btn-glass ml-auto text-sm">
              Open in a new tab
            </a>
            <button id={`${uid}-close-preview`} type="button" onClick={closePreview} className="btn-accent cursor-pointer text-sm">
              Close preview
            </button>
          </div>
        )}
        {/* The website's pages: the one being edited is pressed. */}
        <div className={`thin-scroll mb-2 flex shrink-0 items-center gap-1 overflow-x-auto ${previewing ? "hidden" : ""}`} role="group" aria-label="Pages">
          {site.pages.map((candidate) => (
            <button
              key={candidate.id}
              id={`${uid}-tab-${candidate.id}`}
              type="button"
              aria-pressed={candidate.id === current.id}
              onClick={() => openPage(candidate.id)}
              className="min-h-9 shrink-0 cursor-pointer rounded-full px-3.5 text-sm text-ink-muted transition-colors hover:text-ink aria-pressed:bg-ink aria-pressed:text-paper"
            >
              {candidate.title}
              <span className="sr-only">{`, ${candidate.path}`}</span>
            </button>
          ))}
          <button type="button" onClick={addPage} className="min-h-9 shrink-0 cursor-pointer rounded-full border border-dashed border-rule-strong px-3.5 text-sm hover:border-accent">
            + Add a page
          </button>
        </div>
        <div className="relative h-[75vh] min-h-0 overflow-hidden rounded-2xl border border-rule bg-paper-sunk lg:h-auto lg:flex-1">
          <div className="relative mx-auto h-full max-w-full transition-[width] duration-500 ease-spring" style={{ width }}>
            <iframe ref={frameRef} title="Your page, React output" src={frameAllowed ? "/preview-page" : undefined} className="block h-full w-full border-0 bg-white" />

            {/* Drawn over the frame, never in the way: it only catches its own buttons. */}
            <div aria-hidden={!chosenBox || previewing} className={`pointer-events-none absolute inset-0 overflow-hidden ${previewing ? "hidden" : ""}`}>
              {dropping && outline(dropping) && (
                <div className="absolute inset-x-0 border-4 border-accent bg-accent/10" style={{ top: outline(dropping)!.top, height: outline(dropping)!.height }}>
                  <span className="absolute top-2 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-on-accent">
                    {pictureSlots(registry[dropping].schema).length ? `Drop to add to ${name(dropping)}` : `${name(dropping)} takes no picture`}
                  </span>
                </div>
              )}
              {clicks === "edit" && hoveredBox && (
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

            {note && (
              <p role="status" className="absolute bottom-3 left-1/2 m-0 -translate-x-1/2 rounded-full bg-[#1c1a17] px-4 py-2 text-sm text-white shadow-lg">
                {note}
              </p>
            )}

            {current.sections.length === 0 && !drop && !previewing && (
              <div className="absolute inset-0 overflow-y-auto bg-paper p-6">
                <h3 className="font-display text-3xl leading-none">{current.path === "/" ? "Start with a template" : `Fill ${current.title} from a template`}</h3>
                <p className="mt-2 text-sm text-ink-muted">
                  {site.top.length + site.bottom.length > 0
                    ? "Your header and footer stay; the template's sections go between them. Or drag parts from the left onto this page."
                    : "Or drag parts from the left onto this page."}
                </p>
                {current.path === "/" && site.pages.length === 1 && (
                  <>
                    <h4 className="mt-5 text-sm font-semibold">A whole website</h4>
                    <ul className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-3">
                      {starters.map((option) => (
                        <li key={option.id}>
                          <button
                            type="button"
                            onClick={() => startSite(option.id)}
                            className="h-full w-full cursor-pointer rounded-xl border border-rule bg-paper-sunk p-4 text-left transition-[border-color,translate] duration-300 hover:-translate-y-0.5 hover:border-accent"
                          >
                            <span className="block font-semibold">{`${option.name} website`}</span>
                            <span className="mt-1 block font-mono text-xs text-ink-muted">{option.pages.map(([title]) => title).join(" · ")}</span>
                            <span className="mt-1 block text-xs text-ink-muted">{option.summary}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <h4 className="mt-6 text-sm font-semibold">One page</h4>
                  </>
                )}
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
      <div className="relative flex min-h-0 min-w-0 flex-col gap-4 lg:row-start-2">
        <section aria-labelledby={`${uid}-layers`} className="glass relative flex shrink-0 flex-col rounded-2xl p-4 lg:max-h-[40%]">
          <h2 id={`${uid}-layers`} className="font-display text-2xl leading-none">
            Layers
          </h2>
          {sections.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">Nothing on the page yet.</p>
          ) : (
            <ol ref={layersRef} aria-label="Parts on your page, in order" className="thin-scroll relative mt-3 grid min-h-0 gap-1 overflow-y-auto">
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
                      <span className="shrink-0 px-1 text-xs text-ink-muted">Every page</span>
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
          <section aria-labelledby={`${uid}-options`} className="glass relative flex min-h-0 min-w-0 flex-1 flex-col rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 id={`${uid}-options`} className="font-display text-2xl leading-none">
                {name(chosen.slug)}
              </h2>
              <button type="button" onClick={() => setSelected(null)} className="min-h-9 cursor-pointer rounded-lg px-2 text-sm text-link underline underline-offset-2">
                Page settings
              </button>
            </div>
            {/* How the section sits on the page: the same for every part, so it is set here, not in its options. */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-medium">
              <label className="grid min-w-0 gap-1">
                Width
                <select
                  value={chosen.width ?? ""}
                  onChange={(event) => setLayout(chosen.slug, { width: (event.target.value || undefined) as SectionWidth | undefined })}
                  className="min-h-10 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-2 font-normal"
                >
                  <option value="">Automatic</option>
                  {sectionWidths.map((value) => (
                    <option key={value} value={value}>
                      {{ full: "Full width", wide: "Wide", medium: "Medium", narrow: "Narrow" }[value]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid min-w-0 gap-1">
                Space above and below
                <select
                  value={chosen.space ?? ""}
                  onChange={(event) => setLayout(chosen.slug, { space: (event.target.value || undefined) as SectionSpace | undefined })}
                  className="min-h-10 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-2 font-normal"
                >
                  <option value="">Automatic</option>
                  {sectionSpaces.map((value) => (
                    <option key={value} value={value}>
                      {{ none: "None", small: "Small", medium: "Medium", large: "Large" }[value]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {chosenSlots.length > 0 && (
              <div
                className={`mt-3 rounded-lg border border-dashed p-2.5 ${dropping === chosen.slug ? "border-accent bg-wash" : "border-rule-strong"}`}
                onDragOver={(event) => {
                  if (!event.dataTransfer.types.includes("Files")) return;
                  event.preventDefault();
                  setDropping(chosen.slug);
                }}
                onDragLeave={() => setDropping(null)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDropping(null);
                  const file = event.dataTransfer.files[0];
                  if (file) dropPicture(chosen.slug, file);
                }}
              >
                <p className="text-sm font-medium">Pictures</p>
                <p className="text-xs text-ink-muted">Drop a picture here or on the section, or choose one. It stays in this browser and goes into your downloads.</p>
                <ul className="mt-2 grid gap-2">
                  {chosenSlots.flatMap((slot) => {
                    const items = slot.field ? ((chosen.config[slot.key] as Record<string, string>[]) ?? []) : [chosen.config];
                    return items.map((item, index) => {
                      const value = String(item[slot.field ?? slot.key] ?? "");
                      const label = slot.field ? `${slot.label}, item ${index + 1}` : slot.label;
                      const preview = value.startsWith("https://assets.invalid/") ? shownPictures[value] : value;
                      return (
                        <li key={`${slot.key}-${index}`} className="flex items-center gap-2">
                          <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-md border border-rule bg-paper-sunk">
                            {/* eslint-disable-next-line @next/next/no-img-element -- a thumbnail of the person's own picture */}
                            {preview ? <img src={preview} alt="" className="size-full object-cover" /> : <span className="text-[0.625rem] text-ink-muted">None</span>}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-xs">{label}</span>
                          <label className="btn-glass min-h-9 cursor-pointer px-3 py-1 text-xs">
                            Choose
                            <input
                              type="file"
                              accept={ACCEPTED_PICTURES.join(",")}
                              aria-label={`Choose a picture: ${label}`}
                              className="sr-only"
                              onChange={async (event) => {
                                const file = event.target.files?.[0];
                                event.target.value = "";
                                if (!file) return;
                                try {
                                  setPicture(chosen.slug, slot, await savePicture(file), slot.field ? index : undefined);
                                } catch (error) {
                                  setNote((error as Error).message);
                                  window.setTimeout(() => setNote(""), 4000);
                                }
                              }}
                            />
                          </label>
                          {value && (
                            <button type="button" onClick={() => setPicture(chosen.slug, slot, "", slot.field ? index : undefined)} aria-label={`Remove the picture: ${label}`} className={iconButton}>
                              <Cross />
                            </button>
                          )}
                        </li>
                      );
                    });
                  })}
                </ul>
              </div>
            )}
            <div ref={optionsRef} className="mt-3 flex min-h-0 flex-1 flex-col">
              <OptionsPanel
                key={chosen.slug}
                className="min-h-0 flex-1"
                // The page's colour and theme are every part's, so they are set once, for the page.
                schema={registry[chosen.slug].schema.filter(
                  (option) =>
                    option.key !== "accentColor" &&
                    option.key !== "theme" &&
                    // The menu lists the site's pages; it is turned off in Website settings to write it by hand.
                    !(menuFollows && option.key === "links" && (chosen.slug === "header" || chosen.slug === "footer")) &&
                    // Under a theme, corners are the theme's (Website settings), on every part alike.
                    !(site.look && option.key === "radius"),
                )}
                config={chosen.config}
                onChange={(key, value) => setOption(chosen.slug, { [key]: value })}
                onResetAll={() => setOption(chosen.slug, null)}
              />
            </div>
          </section>
        ) : (
          <form onSubmit={(event) => event.preventDefault()} className="glass thin-scroll relative grid min-h-0 grid-cols-[minmax(0,1fr)] content-start gap-5 overflow-y-auto rounded-2xl p-4">
            <h2 className="font-display text-2xl leading-none">Page settings</h2>
            <label className="grid gap-1.5 text-sm font-medium">
              Page name
              <input
                id={`${uid}-page-title`}
                value={current.title}
                maxLength={40}
                onChange={(event) => editPage({ title: event.target.value })}
                onBlur={(event) => !event.target.value.trim() && editPage({ title: "Page" })}
                className="min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-3 text-base font-normal"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Address
              <input
                key={`${current.id}-${current.path}`}
                defaultValue={current.path}
                readOnly={current.path === "/"}
                aria-describedby={`${uid}-address-note`}
                onBlur={(event) => editPage({ path: addressFor(site, current.id, event.target.value) })}
                className="min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-3 font-mono text-sm font-normal read-only:bg-paper-sunk"
              />
              <span id={`${uid}-address-note`} className="text-xs font-normal text-ink-muted">
                {current.path === "/" ? "The home page is always /." : "Where this page lives on your site, e.g. /pricing."}
              </span>
            </label>
            {current.path !== "/" && (
              <button type="button" onClick={deletePage} className="btn-glass w-fit cursor-pointer text-sm">
                Delete this page
              </button>
            )}
            <p className="text-xs text-ink-muted">Choose a section on the page to set it up.</p>

            <h2 className="mt-2 border-t border-rule pt-5 font-display text-2xl leading-none">Website</h2>
            <PageFields options={page} onChange={(patch) => setPage({ ...page, ...patch })} />
            <ThemePanel
              look={site.look}
              hasHeader={site.top.some((section) => section.slug === "header")}
              schemeSwitch={Boolean(site.top.find((section) => section.slug === "header")?.config.schemeSwitch)}
              onPreset={(preset) => {
                setSite({ ...site, brand: presets[preset].brand, look: lookOf(preset) });
                setSaid(`Theme: ${presets[preset].label}`);
              }}
              onTune={(patch) => site.look && setSite({ ...site, look: { ...site.look, ...patch } })}
              onSchemeSwitch={(on) =>
                setSite({
                  ...site,
                  // A switch only moves parts that follow the system, so turning it on makes the site follow it.
                  theme: on ? "system" : site.theme,
                  top: site.top.map((section) => (section.slug === "header" ? { ...section, config: { ...section.config, schemeSwitch: on } } : section)),
                })
              }
            />
            <label className="flex cursor-pointer items-start gap-2.5 text-sm">
              <input type="checkbox" checked={site.menu} onChange={(event) => setSite({ ...site, menu: event.target.checked })} className="mt-1 size-4 accent-(--color-accent)" />
              <span>
                The header and footer list my pages
                <span className="block text-xs text-ink-muted">With more than one page. Turn it off to write their links yourself.</span>
              </span>
            </label>
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
            {/* Plain links while nothing has to be added in the browser: no kept pictures, one HTML file. */}
            {sitePictures.length === 0 ? (
              <a href={`/download/${siteName}.zip?p=${link}`} download className="btn-accent text-sm">
                Download a Next.js project
              </a>
            ) : (
              <button type="button" disabled={!link} onClick={downloadProject} className="btn-accent cursor-pointer text-sm">
                Download a Next.js project
              </button>
            )}
            {sitePictures.length === 0 && site.pages.length === 1 ? (
              <a href={`/download/${siteName}.html?p=${link}`} download className="btn-glass text-sm">
                Download one HTML file
              </a>
            ) : (
              <button type="button" disabled={!link} onClick={downloadHtml} className="btn-glass cursor-pointer text-sm">
                {site.pages.length === 1 ? "Download one HTML file" : "Download the HTML files (.zip)"}
              </button>
            )}
            <button type="button" disabled={!link} onClick={() => copy(`${origin}/build#p=${link}`, "Link copied")} className="btn-glass cursor-pointer text-sm">
              {site.pages.length === 1 ? "Copy a link to this page" : "Copy a link to this website"}
            </button>
          </p>
          <p className="-mt-2 text-xs text-ink-muted">
            The Next.js project runs as it is: npm install, then npm run dev. The link holds the whole page, so anyone with
            it can open it here.
            {sitePictures.length > 0 &&
              " Pictures you dropped in are in both downloads, but stay in this browser: the link and the install command leave them out."}
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

/**
 * The theme (D87, direction A: presets first). Six finished themes; picking one sets the brand colour too.
 * "Fine-tune" changes one thing at a time. The light and dark switch is the header's, turned on from here.
 */
function ThemePanel({
  look,
  hasHeader,
  schemeSwitch,
  onPreset,
  onTune,
  onSchemeSwitch,
}: {
  look: Look | undefined;
  hasHeader: boolean;
  schemeSwitch: boolean;
  onPreset: (preset: PresetId) => void;
  onTune: (patch: Partial<Look>) => void;
  onSchemeSwitch: (on: boolean) => void;
}) {
  const choice = <K extends keyof Look>(key: K, label: string, options: Record<string, { label: string }>) => (
    <label className="grid min-w-0 gap-1 text-sm font-medium">
      {label}
      <select
        value={look?.[key] as string}
        onChange={(event) => onTune({ [key]: event.target.value } as Partial<Look>)}
        className="min-h-10 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-2 font-normal"
      >
        {Object.entries(options).map(([value, option]) => (
          <option key={value} value={value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <div className="grid gap-3">
      <div>
        <p className="text-sm font-medium">Theme</p>
        <p className="text-xs text-ink-muted">{look ? "Every part on every page takes it." : "None yet: every part keeps its own look. Pick one to give the site one look."}</p>
      </div>
      <div role="group" aria-label="Themes" className="grid grid-cols-2 gap-2">
        {(Object.keys(presets) as PresetId[]).map((id) => {
          const preset = presets[id];
          const family = colourFamilies[preset.look.colours];
          return (
            <button
              key={id}
              type="button"
              aria-pressed={look?.preset === id}
              onClick={() => onPreset(id)}
              className="cursor-pointer rounded-xl border border-rule bg-paper p-2.5 text-left transition-colors hover:border-accent aria-pressed:border-accent aria-pressed:shadow-[inset_0_0_0_1px_var(--color-accent)]"
            >
              <span aria-hidden="true" className="flex gap-1">
                {[preset.brand, family.light.sunk, family.light.text].map((colour, index) => (
                  <span key={index} className="size-4 rounded-full border border-black/10" style={{ background: colour }} />
                ))}
              </span>
              <span className="mt-1.5 block text-sm font-semibold" style={{ fontFamily: fonts[preset.look.headingFont].stack }}>
                {preset.label}
              </span>
              <span className="block text-xs text-ink-muted">{preset.note}</span>
            </button>
          );
        })}
      </div>
      {look && (
        <details className="rounded-lg border border-rule px-3">
          <summary className="min-h-10 cursor-pointer py-2.5 text-sm font-semibold">Fine-tune</summary>
          <div className="grid grid-cols-2 gap-2 pb-3">
            {choice("headingFont", "Headings", fonts)}
            {choice("bodyFont", "Text", fonts)}
            {choice("colours", "Colours", colourFamilies)}
            {choice("corners", "Corners", cornerScales)}
            {choice("buttons", "Buttons", buttonShapes)}
            {choice("space", "Spacing", spacings)}
          </div>
        </details>
      )}
      <label className={`flex items-start gap-2.5 text-sm ${hasHeader ? "cursor-pointer" : "text-ink-muted"}`}>
        <input
          type="checkbox"
          checked={schemeSwitch}
          disabled={!hasHeader}
          onChange={(event) => onSchemeSwitch(event.target.checked)}
          className="mt-1 size-4 accent-(--color-accent)"
        />
        <span>
          Visitors can switch light and dark
          <span className="block text-xs text-ink-muted">
            {hasHeader ? "A switch in the header. The site then starts from each visitor's own setting." : "Needs a site header: add one from the parts."}
          </span>
        </span>
      </label>
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
