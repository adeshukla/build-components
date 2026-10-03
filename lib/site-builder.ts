import { lookFrom, lookOf } from "@/lib/theme";
import {
  basicsFrom,
  blankPage,
  decodePage,
  fromBase64Url,
  inOrder,
  pageTemplate,
  regionOf,
  sectionEntry,
  sectionsFromEntries,
  toBase64Url,
  type BuiltPage,
  type BuiltSection,
} from "@/lib/page-builder";

/*
 * A website made in the builder (D86): pages that share one header and one footer. Each page holds only its
 * own sections; `pageView` shows any page as an ordinary built page (shared top, its sections, shared
 * bottom), so the builder's tools and every output work on it unchanged, and `fromView` splits an edited
 * view back into what is shared and what is the page's.
 *
 * With more than one page, the header's and footer's links are the site's pages, unless that is turned off.
 * A link carries the whole site, compressed; the plain page links from before still open, as a one-page site.
 */

export type SitePage = { id: string; title: string; path: string; sections: BuiltSection[] };
export type BuiltSite = Omit<BuiltPage, "sections"> & { menu: boolean; top: BuiltSection[]; bottom: BuiltSection[]; pages: SitePage[] };

export const MAX_PAGES = 12;
const slugOf = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

/** A one-page site from a page: its banner and footer become the shared ones. */
export function siteFromPage(page: BuiltPage): BuiltSite {
  return {
    name: page.name,
    brand: page.brand,
    theme: page.theme,
    look: page.look,
    menu: true,
    top: page.sections.filter((section) => regionOf(section.slug) === "top"),
    bottom: page.sections.filter((section) => regionOf(section.slug) === "bottom"),
    pages: [{ id: "home", title: "Home", path: "/", sections: page.sections.filter((section) => regionOf(section.slug) === "main") }],
  };
}

/** A new site starts on the Clean theme: every part then shares one look from the first part on. */
export const blankSite = (): BuiltSite => ({ ...siteFromPage(blankPage()), look: lookOf("clean") });

/** The links a menu shows: every page but the home page, eight at most (what a header holds). */
export const menuLinks = (site: BuiltSite) =>
  site.pages.filter((page) => page.path !== "/").slice(0, 8).map((page) => ({ label: page.title, href: page.path }));

/** One page as a built page: the shared header, its own sections, the shared footer. */
export function pageView(site: BuiltSite, id: string): BuiltPage {
  const page = site.pages.find((candidate) => candidate.id === id) ?? site.pages[0];
  const links = site.menu && site.pages.length > 1 ? menuLinks(site) : null;
  const linked = (section: BuiltSection) =>
    links && (section.slug === "header" || section.slug === "footer") ? { ...section, config: { ...section.config, links } } : section;
  return {
    name: site.name,
    brand: site.brand,
    theme: site.theme,
    look: site.look,
    sections: [...site.top.map(linked), ...page.sections, ...site.bottom.map(linked)],
  };
}

/** An edited view put back: its banner and footer are the site's, the rest is the page's. */
export function fromView(site: BuiltSite, id: string, view: BuiltPage): BuiltSite {
  const sections = inOrder(view.sections);
  return {
    ...site,
    name: view.name,
    brand: view.brand,
    theme: view.theme,
    look: view.look,
    top: sections.filter((section) => regionOf(section.slug) === "top"),
    bottom: sections.filter((section) => regionOf(section.slug) === "bottom"),
    pages: site.pages.map((page) => (page.id === id ? { ...page, sections: sections.filter((section) => regionOf(section.slug) === "main") } : page)),
  };
}

/** A new, empty page, with an id and an address no other page has. */
export function newPage(site: BuiltSite, title: string): SitePage {
  const base = slugOf(title) || "page";
  let id = base;
  for (let n = 2; site.pages.some((page) => page.id === id || page.path === `/${id}`); n++) id = `${base}-${n}`;
  return { id, title: title.trim().slice(0, 40) || "Page", path: `/${id}`, sections: [] };
}

/** A page's address from what someone typed: lower case and dashes, unique. The home page keeps "/". */
export function addressFor(site: BuiltSite, id: string, typed: string) {
  if (site.pages.find((page) => page.id === id)?.path === "/") return "/";
  const base = `/${slugOf(typed) || "page"}`;
  let path = base;
  for (let n = 2; site.pages.some((other) => other.id !== id && other.path === path); n++) path = `${base}-${n}`;
  return path;
}

/** The site as plain data, for a link or for this browser's storage. */
export function siteData(site: BuiltSite) {
  return {
    v: 2,
    n: site.name,
    b: site.brand,
    t: site.theme,
    m: site.menu,
    l: site.look,
    top: site.top.map(sectionEntry),
    bottom: site.bottom.map(sectionEntry),
    pages: site.pages.map((page) => ({ i: page.id, t: page.title, p: page.path, s: page.sections.map(sectionEntry) })),
  };
}

/** Reads site data someone else may have written: anything it cannot vouch for is dropped. */
export function siteFrom(data: unknown): BuiltSite | null {
  if (!data || typeof data !== "object") return null;
  const raw = data as Record<string, unknown>;
  const shared = new Set<string>();
  const ids = new Set<string>();
  const paths = new Set<string>();
  const pages: SitePage[] = [];
  for (const entry of Array.isArray(raw.pages) ? raw.pages.slice(0, MAX_PAGES) : []) {
    const { i, t, p, s } = (entry ?? {}) as Record<string, unknown>;
    if (typeof i !== "string" || !/^[a-z0-9-]{1,40}$/.test(i) || ids.has(i)) continue;
    if (typeof p !== "string" || !/^\/[a-z0-9-]{0,40}$/.test(p) || paths.has(p)) continue;
    ids.add(i);
    paths.add(p);
    const title = typeof t === "string" && t.trim() ? t.trim().slice(0, 40) : "Page";
    pages.push({ id: i, title, path: p, sections: sectionsFromEntries(s).filter((section) => regionOf(section.slug) === "main") });
  }
  if (pages.length === 0) return null;
  // There is always a home page.
  if (!paths.has("/")) pages[0] = { ...pages[0], path: "/" };
  return {
    ...basicsFrom(raw),
    menu: raw.m !== false,
    look: lookFrom(raw.l),
    top: sectionsFromEntries(raw.top, shared).filter((section) => regionOf(section.slug) === "top"),
    bottom: sectionsFromEntries(raw.bottom, shared).filter((section) => regionOf(section.slug) === "bottom"),
    pages,
  };
}

async function squeeze(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const out = new Response(new Blob([bytes as Uint8Array<ArrayBuffer>]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

/** The site as a link's text: "z" and the data, compressed, in URL-safe base64. */
export async function encodeSite(site: BuiltSite) {
  const bytes = new TextEncoder().encode(JSON.stringify(siteData(site)));
  return `z${toBase64Url(await squeeze(bytes, new CompressionStream("deflate-raw")))}`;
}

/** A link's text: a whole site, or (from before sites, and the template editor) a single page. */
export async function decodeSite(text: string): Promise<BuiltSite | null> {
  if (!text || text.length > 60_000) return null;
  if (!text.startsWith("z")) {
    const page = decodePage(text);
    return page ? siteFromPage(page) : null;
  }
  try {
    const bytes = await squeeze(fromBase64Url(text.slice(1)), new DecompressionStream("deflate-raw"));
    // A small link must not unpack into something enormous.
    if (bytes.length > 2_000_000) return null;
    return siteFrom(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

/** Every page as a template, named for its address: what every output of a site is made from. */
export function siteTemplates(site: BuiltSite) {
  return site.pages.map((page) => {
    const { template, options } = pageTemplate(pageView(site, page.id));
    return { page, template: { ...template, id: page.id, name: page.title }, options };
  });
}
