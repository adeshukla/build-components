import fs from "node:fs";
import path from "node:path";

/** Reads a component source file from /registry. Server/Node only (pages, route handlers, tests). */
export function readSource(file: string) {
  return fs.readFileSync(path.join(process.cwd(), "registry", file), "utf8");
}

/** All four source files of a component, by registry slug (e.g. "modal"). */
export function readComponentSources(slug: string) {
  return {
    react: readSource(`${slug}/react/${slug}.tsx`),
    html: readSource(`${slug}/vanilla/${slug}.html`),
    css: readSource(`${slug}/vanilla/${slug}.css`),
    js: readSource(`${slug}/vanilla/${slug}.js`),
  };
}
