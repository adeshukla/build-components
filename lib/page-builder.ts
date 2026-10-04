import { fullBleed, partBySlug } from "@/lib/parts";
import { isRegistrySlug, registry, type RegistrySlug } from "@/lib/registry";
import { parseConfig, toSearchParams } from "@/lib/schema";
import { isBleed, resolve, sectionSpaces, sectionWidths, templates, type SectionSpace, type SectionWidth, type Template, type TemplateOptions } from "@/lib/templates";

/*
 * The page builder (D80): a page someone puts together from the catalogue, part by part. It is turned
 * into a template (pageTemplate), so the builder's preview, its checks and every output are the ones
 * templates already have and already test.
 *
 * No accounts: a page lives in the browser, and travels as a link. The link carries each part's options
 * the way a part's own address does, so the server reads it with the same validation (parseConfig).
 */

/** A part on the page: its options, and (D84) how wide it sits and the room around it. Unset: as it comes. */
export type BuiltSection = { slug: RegistrySlug; config: Record<string, unknown>; width?: SectionWidth; space?: SectionSpace };
export type BuiltPage = Omit<TemplateOptions, "sections"> & { sections: BuiltSection[] };

/** Enough for any real page; keeps a link, and the work a link asks of the server, bounded. */
export const MAX_SECTIONS = 30;

/** The page's banner and content info sit outside <main>, wherever they were dropped. */
export function regionOf(slug: string): "top" | "main" | "bottom" {
  if (slug === "header" || slug === "mega-menu" || slug === "announcement-bar") return "top";
  if (slug === "footer") return "bottom";
  return "main";
}

/** A form or a single control reads better in a column than stretched across the page. */
export const isNarrow = (slug: string) => ["Inputs", "Overlays", "Feedback"].includes(partBySlug(slug).category);

/** Top parts first, bottom parts last, the rest in the order they were put. */
export function inOrder(sections: BuiltSection[]) {
  const rank = { top: 0, main: 1, bottom: 2 };
  return [...sections].sort((a, b) => rank[regionOf(a.slug)] - rank[regionOf(b.slug)]);
}

export const blankPage = (): BuiltPage => ({ name: "Northwind", brand: "#2563eb", theme: "light", sections: [] });

/** A part as it comes, ready to add. */
export const newSection = (slug: RegistrySlug): BuiltSection => ({
  slug,
  config: parseConfig(registry[slug].schema, new URLSearchParams()) as Record<string, unknown>,
});

/** A template's page, as a page to keep building: the parts it has on, with the options it gives them. */
export function fromTemplate(template: Template, options: TemplateOptions): BuiltPage {
  return {
    name: options.name,
    brand: options.brand,
    theme: options.theme,
    sections: resolve(template, options).map((section) => ({ slug: section.slug, config: section.config })),
  };
}

const fileName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "page";

/** The page as a template, so every template output works on it. */
export function pageTemplate(page: BuiltPage): { template: Template; options: TemplateOptions } {
  return {
    template: {
      id: fileName(page.name),
      name: "Page",
      type: "Marketing",
      summary: `A page for ${page.name}, put together from parts.`,
      sections: inOrder(page.sections).map((section) => ({
        slug: section.slug,
        region: regionOf(section.slug),
        narrow: isNarrow(section.slug) && !fullBleed.includes(section.slug),
        // Automatic: content in one consistent wide column, banners edge to edge, forms in a reading column.
        width: section.width ?? (isBleed(section.slug) || isNarrow(section.slug) ? undefined : "wide"),
        space: section.space,
        config: () => section.config,
      })),
    },
    options: { name: page.name, brand: page.brand, theme: page.theme, sections: [], look: page.look },
  };
}

/** A section in a link: [slug, options as a query string (only what differs), width, space], the last two if set. */
export function sectionEntry(section: BuiltSection) {
  const entry: string[] = [section.slug, toSearchParams(registry[section.slug].schema, section.config).toString()];
  if (section.width || section.space) entry.push(section.width ?? "", section.space ?? "");
  return entry;
}

/** Sections read back from a link: unknown parts, repeats and anything malformed are dropped. */
export function sectionsFromEntries(entries: unknown, seen = new Set<string>()): BuiltSection[] {
  const sections: BuiltSection[] = [];
  for (const entry of Array.isArray(entries) ? entries.slice(0, MAX_SECTIONS) : []) {
    const [slug, query, width, space] = Array.isArray(entry) ? entry : [];
    // One of each part: two of one would install over each other.
    if (typeof slug !== "string" || !isRegistrySlug(slug) || seen.has(slug) || typeof query !== "string") continue;
    seen.add(slug);
    sections.push({
      slug,
      config: parseConfig(registry[slug].schema, new URLSearchParams(query)) as Record<string, unknown>,
      ...(sectionWidths.includes(width) ? { width } : {}),
      ...(sectionSpaces.includes(space) ? { space } : {}),
    });
  }
  return sections;
}

/** The name, colour and theme from a link, each checked, each with its default. */
export function basicsFrom(data: { n?: unknown; b?: unknown; t?: unknown }) {
  const fallback = blankPage();
  return {
    name: typeof data.n === "string" && data.n.trim() ? data.n.trim().slice(0, 40) : fallback.name,
    brand: typeof data.b === "string" && /^#[0-9a-f]{6}$/i.test(data.b) ? data.b : fallback.brand,
    theme: (data.t === "dark" || data.t === "system" ? data.t : "light") as BuiltPage["theme"],
  };
}

export function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export const fromBase64Url = (text: string) => Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), (char) => char.charCodeAt(0));

/*
 * The link: JSON of the page with each part's options as its query string (only what differs from the
 * part's defaults), in URL-safe base64. Uncompressed, so reading it is synchronous everywhere. A whole
 * website travels in its own, compressed form (lib/site-builder.ts), which reads this one too.
 */
export function encodePage(page: BuiltPage) {
  const data = { n: page.name, b: page.brand, t: page.theme, s: page.sections.map(sectionEntry) };
  return toBase64Url(new TextEncoder().encode(JSON.stringify(data)));
}

/** Reads a link someone else may have written: anything it cannot vouch for is dropped. */
export function decodePage(text: string): BuiltPage | null {
  if (text.length > 60_000) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(text)));
    return { ...basicsFrom(data), sections: sectionsFromEntries(data.s) };
  } catch {
    return null;
  }
}

/*
 * Suggestions while building (D88). What a page is missing comes first: a banner, one main heading, a
 * footer. Then what usually comes next, learnt from the templates rather than written by hand: the parts
 * that follow this one in the templates that use it, the most common first; then what the templates most
 * like this page have that it does not.
 */
export type Suggestion = { slug: RegistrySlug; why: string };

export function suggestions(page: BuiltPage, after: RegistrySlug | null, limit = 4): Suggestion[] {
  const has = new Set(page.sections.map((section) => section.slug));
  const main = page.sections.filter((section) => regionOf(section.slug) === "main");
  const out: Suggestion[] = [];
  const offer = (slug: RegistrySlug, why: string) => {
    if (!has.has(slug) && !out.some((suggestion) => suggestion.slug === slug)) out.push({ slug, why });
  };

  if (!has.has("header") && !has.has("mega-menu")) offer("header", "Every page needs a way around");
  const h1 = page.sections.some((section) => section.slug === "page-header" || section.config.headingLevel === "h1");
  if (!h1) offer(main.length === 0 ? "hero" : "page-header", "Gives the page its one main heading");
  if (!has.has("footer") && main.length > 0) offer("footer", "Every page ends with one");

  const from = after && regionOf(after) === "main" ? after : (main.at(-1)?.slug ?? null);
  const counts = new Map<RegistrySlug, number>();
  for (const template of templates) {
    const slugs = template.sections.filter((section) => section.region === "main").map((section) => section.slug);
    const at = from ? slugs.indexOf(from) : -1;
    const next = from ? (at === -1 ? undefined : slugs[at + 1]) : slugs[0];
    if (next) counts.set(next, (counts.get(next) ?? 0) + 1);
  }
  const why = from ? `Often follows ${partBySlug(from).name}` : "Pages often open with it";
  // Twice at least: once is one template's choice, not a pattern.
  for (const [slug, count] of [...counts].sort((a, b) => b[1] - a[1])) if (count > 1) offer(slug, why);

  // Then the rest of the templates most like this page: the more parts they share with it, the closer.
  const alike = templates
    .map((template) => {
      const slugs = template.sections.filter((section) => section.region === "main").map((section) => section.slug);
      return { template, slugs, shared: slugs.filter((slug) => has.has(slug)).length };
    })
    .filter((candidate) => candidate.shared > 0)
    .sort((a, b) => b.shared - a.shared);
  for (const { template, slugs } of alike) for (const slug of slugs) offer(slug, `In the ${template.name.toLowerCase()} template`);
  return out.slice(0, limit);
}
