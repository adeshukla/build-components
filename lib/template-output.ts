import { markupOf } from "@/lib/framework-output";
import { applyConfig } from "@/lib/export";
import { registry, type RegistrySlug } from "@/lib/registry";
import { toSearchParams } from "@/lib/schema";
import { resolve, sectionFrame, type Template, type TemplateOptions } from "@/lib/templates";
import { themeCss } from "@/lib/theme";

/*
 * What a template exports. Pure functions, used by the editor in the browser and by the registry route and
 * the tests on the server, so all three can only ever produce the same thing.
 */

/** The page's own surface: the parts paint theirs, this is what shows between them. */
const surfaces = { light: { bg: "#ffffff", fg: "#16121f" }, dark: { bg: "#141019", fg: "#f6f5fa" } };

/** Each part's install address with the template's options applied, so it needs no props on the page. */
export function partInstallUrls(template: Template, options: TemplateOptions, origin: string) {
  return resolve(template, options).map((section) => {
    const query = toSearchParams(registry[section.slug].schema, section.config).toString();
    return `${origin}/r/${section.slug}.json${query ? `?${query}` : ""}`;
  });
}

export function templateInstallCommand(template: Template, options: TemplateOptions, origin: string) {
  const query = new URLSearchParams({
    name: options.name,
    brand: options.brand,
    theme: options.theme,
    sections: options.sections.join(","),
  });
  return `npx shadcn@latest add "${origin}/r/templates/${template.id}.json?${query}"`;
}

/**
 * app/<id>/page.tsx for the React output. The parts it imports are installed with the options already in
 * them (see partInstallUrls), so the page only arranges them. `exportNames` maps a slug to the name its
 * file exports, read from the source on the server.
 */
export function templateReactSource(
  template: Template,
  options: TemplateOptions,
  exportNames: Record<string, string>,
  /** Where each part's file is imported from; a website keeps each page's parts in a folder of its own. */
  importFrom: (slug: string) => string = (slug) => `@/components/${slug}`,
  /** With a theme: where the page imports bc-theme.css from, when no layout does it for it. */
  themeImport?: string,
) {
  const sections = resolve(template, options);
  const name = (slug: string) => exportNames[slug] ?? slug;
  const dark = options.theme === "dark";
  const render = (section: (typeof sections)[number]) => {
    const tag = `<${name(section.slug)} />`;
    const { outer, inner } = sectionFrame(section);
    if (!outer && !inner) return tag;
    const body = inner ? `<div className="${inner}">\n            ${tag}\n          </div>` : tag;
    return `<div className="${outer}">\n          ${body}\n        </div>`;
  };
  const top = sections.filter((s) => s.region === "top").map(render);
  const side = sections.filter((s) => s.region === "side").map(render);
  const main = sections.filter((s) => s.region === "main").map(render);
  const bottom = sections.filter((s) => s.region === "bottom").map(render);
  const imports = [...new Set(sections.map((s) => s.slug))]
    .map((slug) => `import { ${name(slug)} } from "${importFrom(slug)}";`)
    .join("\n")
    .concat(options.look && themeImport ? `\nimport "${themeImport}";` : "");
  const surface = options.look
    ? `bc-page bc-page--${options.theme}`
    : options.theme === "system" ? "bg-white text-[#16121f] dark:bg-[#141019] dark:text-[#f6f5fa]" : dark ? "bg-[#141019] text-[#f6f5fa]" : "bg-white text-[#16121f]";
  const mainBlock = `<main id="main" tabIndex={-1} className="flex-1 outline-none">\n        ${main.join("\n        ")}\n      </main>`;
  const body = side.length
    ? `<div className="flex-1 md:grid md:grid-cols-[auto_1fr]">\n        <div>\n          ${side.join("\n          ")}\n        </div>\n        ${mainBlock.replace(/\n/g, "\n  ")}\n      </div>`
    : mainBlock;
  return `// ${template.name} for ${options.name}: ${sections.length} parts from Build Components.
// Each part was installed with this page's options already set, so none of them needs props here.
${imports}

export default function ${componentName(template.name)}() {
  return (
    <div className="flex min-h-dvh flex-col ${surface}">
      ${[...top, body, ...bottom].join("\n      ")}
    </div>
  );
}
`;
}

/** "Pricing page" → PricingPage, "Checkout" → CheckoutPage. */
function componentName(name: string) {
  const words = name.split(/[^a-z0-9]+/i).filter(Boolean).map((word) => word[0].toUpperCase() + word.slice(1));
  return words.at(-1) === "Page" ? words.join("") : `${words.join("")}Page`;
}

/** A part's markup with these options, as its HTML output has it in <body> (also the framework outputs'). */
export function partMarkup(slug: string, config: Record<string, unknown>, fixedHtml: string) {
  const render = registry[slug as RegistrySlug];
  return markupOf("renderHtml" in render && render.renderHtml ? render.renderHtml(config) : fixedHtml);
}

/**
 * The HTML/CSS/JS output as one file: every part's markup in place, all their CSS in one <style> and all
 * their scripts in one <script>, each with the template's options applied.
 */
export function templateHtml(
  template: Template,
  options: TemplateOptions,
  sources: Record<string, { css: string; js: string; html?: string }>,
) {
  const sections = resolve(template, options);
  const markup = (section: (typeof sections)[number]) => {
    const html = partMarkup(section.slug, section.config, sources[section.slug]?.html ?? "");
    const { width, space } = sectionFrame(section);
    const outer = [width !== "full" && "tpl-px", space !== "none" && `tpl-py-${space}`].filter(Boolean).join(" ");
    const inner = width === "full" || width === "auto" ? "" : `tpl-max-${width}`;
    if (!outer && !inner) return html;
    return `<div class="${outer}">${inner ? `<div class="${inner}">${html}</div>` : html}</div>`;
  };
  const region = (name: string) => sections.filter((s) => s.region === name).map(markup).join("\n");
  const side = region("side");
  const main = `<main id="main" tabindex="-1">\n${region("main")}\n</main>`;
  const slugs = [...new Set(sections.map((s) => s.slug))];
  const css = slugs.map((slug) => `/* ${slug} */\n${sources[slug]?.css ?? ""}`).join("\n");
  const js = sections
    .filter((section) => sources[section.slug]?.js)
    .map((section) => applyConfig(sources[section.slug].js, section.config))
    .join("\n");
  const { light, dark } = surfaces;
  const page = options.look
    ? ""
    : options.theme === "dark"
      ? `background:${dark.bg};color:${dark.fg}`
      : `background:${light.bg};color:${light.fg}`;
  const system = options.look ? themeCss(options.look) : options.theme === "system" ? `@media (prefers-color-scheme: dark){body{background:${dark.bg};color:${dark.fg}}}` : "";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${template.name} | ${options.name.replace(/[<>&"]/g, "")}</title>
    <style>
*,*::before,*::after{box-sizing:border-box}
body{margin:0;min-height:100dvh;display:flex;flex-direction:column;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.5;${page}}
${system}
main{flex:1}
main:focus{outline:none}
.tpl-px{padding-inline:24px}
@media (min-width:640px){.tpl-px{padding-inline:32px}}
.tpl-py-small{padding-block:calc(24px*var(--bc-space,1))}
.tpl-py-medium{padding-block:calc(40px*var(--bc-space,1))}
.tpl-py-large{padding-block:calc(80px*var(--bc-space,1))}
.tpl-max-wide,.tpl-max-medium,.tpl-max-narrow{margin-inline:auto}
.tpl-max-wide{max-width:72rem}
.tpl-max-medium{max-width:56rem}
.tpl-max-narrow{max-width:42rem}
.tpl-split{display:block}
@media (min-width:768px){.tpl-split{display:grid;grid-template-columns:auto 1fr;flex:1}}
${css}
    </style>
  </head>
  <body${options.look ? ` class="bc-page bc-page--${options.theme}"` : ""}>
${region("top")}
${side ? `<div class="tpl-split">\n<div>\n${side}\n</div>\n${main}\n</div>` : main}
${region("bottom")}
${js ? `<script>\n${js}\n</script>` : ""}
  </body>
</html>
`;
}
