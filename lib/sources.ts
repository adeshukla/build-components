import fs from "node:fs";
import path from "node:path";

/** Reads a component source file from /registry. Server/Node only (pages, route handlers, tests). */
export function readSource(file: string) {
  return fs.readFileSync(path.join(process.cwd(), "registry", file), "utf8");
}

function readOptional(file: string) {
  const full = path.join(process.cwd(), "registry", file);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : "";
}

/**
 * A component's source files by registry slug. HTML-first components (CTA, header, footer, tabs) generate their
 * markup from the options instead of shipping a fixed .html, and some ship no JavaScript at all.
 */
export function readComponentSources(slug: string) {
  return {
    react: readSource(`${slug}/react/${slug}.tsx`),
    html: readOptional(`${slug}/vanilla/${slug}.html`),
    css: readSource(`${slug}/vanilla/${slug}.css`),
    js: readOptional(`${slug}/vanilla/${slug}.js`),
  };
}

/**
 * What a template's outputs need from each of its parts: the CSS, JS and (for parts driven by their script)
 * the fixed markup of the HTML output, and the name the React file exports (the page imports it by it).
 */
export function readTemplateSources(slugs: string[]) {
  const sources: Record<string, { css: string; js: string; html: string }> = {};
  const exportNames: Record<string, string> = {};
  for (const slug of new Set(slugs)) {
    const { react, html, css, js } = readComponentSources(slug);
    sources[slug] = { css, js, html };
    // The component, not a helper some parts also export (sayDate, fieldName): only it is capitalised.
    exportNames[slug] = /export function ([A-Z]\w*)\(/.exec(react)?.[1] ?? slug;
  }
  return { sources, exportNames };
}
