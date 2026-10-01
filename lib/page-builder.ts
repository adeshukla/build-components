import { fullBleed, partBySlug } from "@/lib/parts";
import { isRegistrySlug, registry, type RegistrySlug } from "@/lib/registry";
import { parseConfig, toSearchParams } from "@/lib/schema";
import { resolve, type Template, type TemplateOptions } from "@/lib/templates";

/*
 * The page builder (D80): a page someone puts together from the catalogue, part by part. It is turned
 * into a template (pageTemplate), so the builder's preview, its checks and every output are the ones
 * templates already have and already test.
 *
 * No accounts: a page lives in the browser, and travels as a link. The link carries each part's options
 * the way a part's own address does, so the server reads it with the same validation (parseConfig).
 */

export type BuiltSection = { slug: RegistrySlug; config: Record<string, unknown> };
export type BuiltPage = Omit<TemplateOptions, "sections"> & { sections: BuiltSection[] };

/** Enough for any real page; keeps a link, and the work a link asks of the server, bounded. */
export const MAX_SECTIONS = 30;

/** The page's banner and content info sit outside <main>, wherever they were dropped. */
export function regionOf(slug: string): "top" | "main" | "bottom" {
  if (slug === "header" || slug === "mega-menu") return "top";
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
        config: () => section.config,
      })),
    },
    options: { name: page.name, brand: page.brand, theme: page.theme, sections: [] },
  };
}

/*
 * The link: JSON of the page with each part's options as its query string (only what differs from the
 * part's defaults), in URL-safe base64. Uncompressed, so reading it is synchronous everywhere.
 */
export function encodePage(page: BuiltPage) {
  const data = {
    n: page.name,
    b: page.brand,
    t: page.theme,
    s: page.sections.map((section) => [section.slug, toSearchParams(registry[section.slug].schema, section.config).toString()]),
  };
  let binary = "";
  for (const byte of new TextEncoder().encode(JSON.stringify(data))) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Reads a link someone else may have written: anything it cannot vouch for is dropped. */
export function decodePage(text: string): BuiltPage | null {
  if (text.length > 60_000) return null;
  try {
    const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
    const data = JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0))));
    const fallback = blankPage();
    const seen = new Set<string>();
    const sections: BuiltSection[] = [];
    for (const entry of Array.isArray(data.s) ? data.s.slice(0, MAX_SECTIONS) : []) {
      const [slug, query] = Array.isArray(entry) ? entry : [];
      // One of each part: two of one would install over each other.
      if (typeof slug !== "string" || !isRegistrySlug(slug) || seen.has(slug) || typeof query !== "string") continue;
      seen.add(slug);
      sections.push({ slug, config: parseConfig(registry[slug].schema, new URLSearchParams(query)) as Record<string, unknown> });
    }
    return {
      name: typeof data.n === "string" && data.n.trim() ? data.n.trim().slice(0, 40) : fallback.name,
      brand: typeof data.b === "string" && /^#[0-9a-f]{6}$/i.test(data.b) ? data.b : fallback.brand,
      theme: data.t === "dark" || data.t === "system" ? data.t : "light",
      sections,
    };
  } catch {
    return null;
  }
}
