import { defaultOptions, templateById } from "@/lib/templates";
import { lookFrom, lookOf, type Look } from "@/lib/theme";
import {
  basicsFrom,
  blankPage,
  decodePage,
  fromBase64Url,
  fromTemplate,
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

/** A page, and (D96) what search engines and link previews read about it: a description and a picture. */
export type SitePage = { id: string; title: string; path: string; sections: BuiltSection[]; description?: string; image?: string };
/** `url` (D96) is where the site will live, e.g. https://northwind.example: the sitemap and link previews need it. */
export type BuiltSite = Omit<BuiltPage, "sections"> & { menu: boolean; top: BuiltSection[]; bottom: BuiltSection[]; pages: SitePage[]; url?: string };

export const MAX_PAGES = 12;
export const MAX_DESCRIPTION = 160;

/** A site's address as typed, reduced to its origin ("https://northwind.example"), or "" if it is not one. */
export function siteAddress(typed: unknown) {
  if (typeof typed !== "string" || !typed.trim()) return "";
  try {
    const url = new URL(/^https?:\/\//i.test(typed.trim()) ? typed.trim() : `https://${typed.trim()}`);
    return /^https?:$/.test(url.protocol) && url.hostname.includes(".") ? url.origin : "";
  } catch {
    return "";
  }
}

/** A share picture's address: a full http(s) web address, or "" if it is not one. */
export function pictureAddress(typed: unknown) {
  if (typeof typed !== "string" || !typed.trim() || typed.length > 500) return "";
  try {
    const url = new URL(typed.trim());
    return /^https?:$/.test(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}
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

/**
 * Whole websites to start from (D88): each page is a page template, and every page shares the header and
 * footer of the first. The menu then lists the pages, so the links between them work from the start.
 */
export const starters = [
  {
    id: "software",
    name: "Software product",
    summary: "Home, pricing, blog, changelog, help and contact: the site a product needs on launch day.",
    pages: [["Home", "home-page"], ["Pricing", "pricing-page"], ["Blog", "blog"], ["Changelog", "changelog"], ["Help", "help-centre"], ["Contact", "contact"]],
  },
  {
    id: "studio",
    name: "Studio",
    summary: "What you offer, who you are, the team, your writing and a way to start a project.",
    pages: [["Home", "services"], ["About", "about"], ["Team", "team"], ["Blog", "blog"], ["Contact", "contact"]],
  },
  {
    id: "company",
    name: "Company",
    summary: "A company's front page, its story, its people, its open roles and its questions.",
    pages: [["Home", "home-page"], ["About", "about"], ["Team", "team"], ["Careers", "careers"], ["FAQ", "faq-page"], ["Contact", "contact"]],
  },
  {
    id: "blog",
    name: "Blog",
    summary: "Posts first, one post laid out to read, a page about you and a way to write to you.",
    pages: [["Home", "blog"], ["A post", "article"], ["About", "about"], ["Contact", "contact"]],
  },
  {
    id: "shop",
    name: "Shop",
    summary: "Products in a grid, a product page to copy for each one, the basket, checkout, your story and a way to get in touch.",
    pages: [["Home", "shop"], ["Product", "product-page"], ["Basket", "basket"], ["Checkout", "checkout"], ["About", "about"], ["Contact", "contact"]],
  },
  {
    id: "launch",
    name: "Launch",
    summary: "Before it opens: a countdown with a sign-up, the questions people ask, and a way to get in touch.",
    pages: [["Home", "coming-soon"], ["FAQ", "faq-page"], ["Contact", "contact"]],
  },
] as const;

/** A starter as a site, with the name, colour, theme and look already chosen. */
export function siteFromStarter(id: string, basics: { name: string; brand: string; theme: BuiltSite["theme"]; look?: Look }): BuiltSite | null {
  const starter = starters.find((candidate) => candidate.id === id);
  if (!starter) return null;
  const pages = starter.pages.map(([title, templateId]) => {
    const template = templateById(templateId)!;
    return { title, page: fromTemplate(template, { ...defaultOptions(template), ...basics }) };
  });
  const site = { ...siteFromPage(pages[0].page), look: basics.look };
  return {
    ...site,
    pages: pages.map(({ title, page }, index) => {
      const id = index === 0 ? "home" : slugOf(title);
      return { id, title, path: index === 0 ? "/" : `/${id}`, sections: page.sections.filter((section) => regionOf(section.slug) === "main") };
    }),
  };
}

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
    ...(site.url ? { u: site.url } : {}),
    top: site.top.map(sectionEntry),
    bottom: site.bottom.map(sectionEntry),
    pages: site.pages.map((page) => ({
      i: page.id,
      t: page.title,
      p: page.path,
      s: page.sections.map(sectionEntry),
      ...(page.description ? { d: page.description } : {}),
      ...(page.image ? { g: page.image } : {}),
    })),
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
    const { i, t, p, s, d, g } = (entry ?? {}) as Record<string, unknown>;
    if (typeof i !== "string" || !/^[a-z0-9-]{1,40}$/.test(i) || ids.has(i)) continue;
    if (typeof p !== "string" || !/^\/[a-z0-9-]{0,40}$/.test(p) || paths.has(p)) continue;
    ids.add(i);
    paths.add(p);
    const title = typeof t === "string" && t.trim() ? t.trim().slice(0, 40) : "Page";
    const description = typeof d === "string" ? d.trim().slice(0, MAX_DESCRIPTION) : "";
    const image = pictureAddress(g);
    pages.push({
      id: i,
      title,
      path: p,
      sections: sectionsFromEntries(s).filter((section) => regionOf(section.slug) === "main"),
      ...(description ? { description } : {}),
      ...(image ? { image } : {}),
    });
  }
  if (pages.length === 0) return null;
  // There is always a home page.
  if (!paths.has("/")) pages[0] = { ...pages[0], path: "/" };
  const url = siteAddress(raw.u);
  return {
    ...basicsFrom(raw),
    ...(url ? { url } : {}),
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
