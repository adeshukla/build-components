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
 * A component's source files by registry slug. HTML-first components (CTA, header) generate their
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
