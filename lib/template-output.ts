import { applyConfig } from "@/lib/export";
import { registry, type RegistrySlug } from "@/lib/registry";
import { toSearchParams } from "@/lib/schema";
import { resolve, type Template, type TemplateOptions } from "@/lib/templates";

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
export function templateReactSource(template: Template, options: TemplateOptions, exportNames: Record<string, string>) {
  const sections = resolve(template, options);
  const name = (slug: string) => exportNames[slug] ?? slug;
  const dark = options.theme === "dark";
  const pad = (tag: string, narrow?: boolean) =>
    narrow
      ? `<div className="px-6 py-10 sm:px-8">\n          <div className="mx-auto max-w-2xl">\n            <${tag} />\n          </div>\n        </div>`
      : `<div className="px-6 py-10 sm:px-8">\n          <${tag} />\n        </div>`;
  const render = (section: (typeof sections)[number]) => (section.bleed ? `<${name(section.slug)} />` : pad(name(section.slug), section.narrow));
  const top = sections.filter((s) => s.region === "top").map(render);
  const side = sections.filter((s) => s.region === "side").map(render);
  const main = sections.filter((s) => s.region === "main").map(render);
  const bottom = sections.filter((s) => s.region === "bottom").map(render);
  const imports = [...new Set(sections.map((s) => s.slug))]
    .map((slug) => `import { ${name(slug)} } from "@/components/${slug}";`)
    .join("\n");
  const surface = options.theme === "system" ? "bg-white text-[#16121f] dark:bg-[#141019] dark:text-[#f6f5fa]" : dark ? "bg-[#141019] text-[#f6f5fa]" : "bg-white text-[#16121f]";
  const mainBlock = `<main id="main" tabIndex={-1} className="outline-none">\n        ${main.join("\n        ")}\n      </main>`;
  const body = side.length
    ? `<div className="md:grid md:grid-cols-[auto_1fr]">\n        <div>\n          ${side.join("\n          ")}\n        </div>\n        ${mainBlock.replace(/\n/g, "\n  ")}\n      </div>`
    : mainBlock;
  return `// ${template.name} for ${options.name}: ${sections.length} parts from Build Components.
// Each part was installed with this page's options already set, so none of them needs props here.
${imports}

export default function ${componentName(template.name)}() {
  return (
    <div className="min-h-dvh ${surface}">
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

/** The markup a part's HTML output puts in <body>, without its script tag or any demo stand-in. */
function bodyOf(page: string) {
  const inner = page.slice(page.indexOf("<body>") + "<body>".length, page.lastIndexOf("</body>"));
  return (
    inner
      .replace(/\s*<script src="[^"]+"><\/script>/g, "")
      // The header ships a stand-in <main> so its skip link has somewhere to go; the page has a real one.
      .replace(/\s*<main id="main" class="hd-demo-main">[\s\S]*?<\/main>/, "")
      .trim()
  );
}

/**
 * The HTML/CSS/JS output as one file: every part's markup in place, all their CSS in one <style> and all
 * their scripts in one <script>, each with the template's options applied.
 */
export function templateHtml(
  template: Template,
  options: TemplateOptions,
  sources: Record<string, { css: string; js: string }>,
) {
  const sections = resolve(template, options);
  const markup = (section: (typeof sections)[number]) => {
    const render = registry[section.slug as RegistrySlug];
    const html = "renderHtml" in render && render.renderHtml ? bodyOf(render.renderHtml(section.config)) : "";
    if (section.bleed) return html;
    return `<div class="tpl-pad">${section.narrow ? `<div class="tpl-narrow">${html}</div>` : html}</div>`;
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
  const page =
    options.theme === "dark"
      ? `background:${dark.bg};color:${dark.fg}`
      : `background:${light.bg};color:${light.fg}`;
  const system = options.theme === "system" ? `@media (prefers-color-scheme: dark){body{background:${dark.bg};color:${dark.fg}}}` : "";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${template.name} | ${options.name.replace(/[<>&"]/g, "")}</title>
    <style>
*,*::before,*::after{box-sizing:border-box}
body{margin:0;min-height:100dvh;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.5;${page}}
${system}
main:focus{outline:none}
.tpl-pad{padding:40px 24px}
@media (min-width:640px){.tpl-pad{padding:40px 32px}}
.tpl-narrow{max-width:42rem;margin-inline:auto}
.tpl-split{display:block}
@media (min-width:768px){.tpl-split{display:grid;grid-template-columns:auto 1fr}}
${css}
    </style>
  </head>
  <body>
${region("top")}
${side ? `<div class="tpl-split">\n<div>\n${side}\n</div>\n${main}\n</div>` : main}
${region("bottom")}
${js ? `<script>\n${js}\n</script>` : ""}
  </body>
</html>
`;
}
