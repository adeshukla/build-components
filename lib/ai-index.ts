import { inStock, partBySlug } from "@/lib/parts";
import { isRegistrySlug, registry, type RegistrySlug } from "@/lib/registry";
import type { Option } from "@/lib/schema";
import { siteDescription, siteName, siteUrl } from "@/lib/site";
import { templates } from "@/lib/templates";
import { versionOf } from "@/lib/versions";

/*
 * For tools that read the site rather than people (D91): a shadcn registry index, so the CLI and its MCP
 * server can list and search the parts under a namespace, and llms.txt files, so an AI assistant knows what
 * each part is called, what it does and how to set its options. All of it is generated from the registry
 * and the schemas, the same ones the editor uses, so it cannot drift from the parts.
 */

const slugs = inStock.map((part) => part.slug).filter(isRegistrySlug);

/** The registry index: /r/registry.json, which is also what `@build-components/registry` resolves to. */
export function registryIndex() {
  return {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "build-components",
    homepage: siteUrl,
    items: slugs.map((slug) => ({
      name: slug,
      type: "registry:component",
      title: registry[slug].title,
      description: registry[slug].description,
      categories: [partBySlug(slug).category, partBySlug(slug).group],
      meta: { version: versionOf(slug), page: `${siteUrl}/${slug}`, aka: partBySlug(slug).aka },
    })),
  };
}

const setup = [
  "## Install a part",
  "",
  `Every part is a shadcn registry item. Install with your options in the query string:`,
  "",
  `    npx shadcn@latest add "${siteUrl}/r/date-picker.json?theme=dark&accentColor=%237c3aed"`,
  "",
  "Or add the namespace to components.json once, then install by name (with the default options):",
  "",
  `    "registries": { "@build-components": "${siteUrl}/r/{name}.json" }`,
  "    npx shadcn@latest add @build-components/date-picker",
  "",
  "The React output needs Tailwind CSS v4. Each part's page also gives plain HTML/CSS/JS to copy.",
  "Options left out keep their defaults; values that are not valid are ignored.",
];

/** /llms.txt: what the site is, how to install, and every part and template with its links. */
export function llmsTxt() {
  return [
    `# ${siteName}`,
    "",
    `> ${siteDescription}`,
    "",
    ...setup,
    "",
    `Every option of every part: ${siteUrl}/llms-full.txt`,
    "",
    "## Parts",
    "",
    ...slugs.map((slug) => `- [${registry[slug].title}](${siteUrl}/${slug}): ${registry[slug].description} Install: ${siteUrl}/r/${slug}.json`),
    "",
    "## Page templates",
    "",
    ...templates.map((template) => `- [${template.name}](${siteUrl}/templates/${template.id}): ${template.summary} Install: ${siteUrl}/r/templates/${template.id}.json`),
    "",
  ].join("\n");
}

/** One option as a line: its key, what values it takes, its default and what it does. */
function optionLine(option: Option) {
  const takes =
    option.type === "select"
      ? `one of ${option.options.join(", ")}`
      : option.type === "number"
        ? `a number from ${option.min} to ${option.max}`
        : option.type === "color"
          ? "a colour as #rrggbb"
          : option.type === "boolean"
            ? "true or false"
            : option.type === "date"
              ? "a date as YYYY-MM-DD, or empty"
              : option.type === "list"
                ? `a JSON array of objects with ${option.fields.map((field) => field.key).join(", ")}`
                : `text, up to ${option.maxLength} characters${option.format === "url" ? ", a link (http, https, a path or #)" : ""}`;
  const fallback = option.type === "list" ? `${option.default.length} items` : JSON.stringify(option.default);
  return `- \`${option.key}\`: ${takes}. Default ${fallback}.${option.description ? ` ${option.description}` : ""}`;
}

/** /llms-full.txt: the same, with every option of every part. */
export function llmsFullTxt() {
  return [
    `# ${siteName}: every part and its options`,
    "",
    `> ${siteDescription}`,
    "",
    ...setup,
    "",
    ...slugs.flatMap((slug: RegistrySlug) => [
      `## ${registry[slug].title} (${slug}, ${versionOf(slug)})`,
      "",
      registry[slug].description,
      "",
      `Page: ${siteUrl}/${slug} · Install: ${siteUrl}/r/${slug}.json`,
      "",
      ...(registry[slug].schema as readonly Option[]).map(optionLine),
      "",
    ]),
  ].join("\n");
}
