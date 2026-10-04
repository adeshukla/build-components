import fs from "node:fs";
import path from "node:path";
import { partBySlug } from "@/lib/parts";
import { isRegistrySlug } from "@/lib/registry";
import { siteUrl } from "@/lib/site";
import { versionOf } from "@/lib/versions";

/**
 * The first line of every file a part gives out (D90): which part, which version, and where its changes are
 * listed, so a copy can be checked against the part page long after it was taken.
 */
function stamp(file: string, source: string) {
  const slug = file.split("/")[0];
  if (!isRegistrySlug(slug) || source === "") return source;
  const line = `${partBySlug(slug).name} ${versionOf(slug)} from Build Components. Changes: ${siteUrl}/${slug}#changes`;
  if (file.endsWith(".css")) return `/* ${line} */\n${source}`;
  // A whole document keeps its doctype first.
  if (file.endsWith(".html")) return source.replace(/^(<!doctype html>\r?\n)?/i, `$1<!-- ${line} -->\n`);
  return `// ${line}\n${source}`;
}

/** Reads a component source file from /registry, stamped. Server/Node only (pages, route handlers, tests). */
export function readSource(file: string) {
  return stamp(file, fs.readFileSync(path.join(process.cwd(), "registry", file), "utf8"));
}

function readOptional(file: string) {
  const full = path.join(process.cwd(), "registry", file);
  return fs.existsSync(full) ? stamp(file, fs.readFileSync(full, "utf8")) : "";
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
