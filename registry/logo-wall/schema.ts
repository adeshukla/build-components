import type { ConfigOf, Schema } from "@/lib/schema";
import type { LogoWallConfig } from "./react/logo-wall";

export const logoWallSchema = [
  { key: "heading", label: "Heading", description: "\"Built with\" is a claim about you. \"Trusted by\" is a claim about someone else.", group: "Content", type: "text", default: "Built with", maxLength: 80 },
  { key: "headingLevel", label: "Heading level", description: "Use p for a quiet label that is not part of the page's outline.", group: "Content", type: "select", default: "h2", options: ["h2", "h3", "p"] },
  {
    key: "items",
    label: "Names",
    description: "No images ship with this part: with no source, the name is set as a wordmark. alt is always the name, never the word \"logo\".",
    group: "Content",
    type: "list",
    default: [
      { name: "Next.js", href: "", src: "" },
      { name: "React", href: "", src: "" },
      { name: "Tailwind CSS", href: "", src: "" },
      { name: "TypeScript", href: "", src: "" },
      { name: "Playwright", href: "", src: "" },
      { name: "axe", href: "", src: "" },
    ],
    fields: [
      { key: "name", label: "Name", maxLength: 60 },
      { key: "href", label: "Links to", maxLength: 300, format: "url" },
      { key: "src", label: "Image URL", maxLength: 300 },
    ],
    maxItems: 24,
    itemLabel: "Name",
  },
  { key: "columns", label: "Columns", group: "Style", type: "number", default: 3, min: 1, max: 8 },
  { key: "grayscale", label: "Grey until hovered", description: "Only applies to images, and only to how they look.", group: "Style", type: "boolean", default: false },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or follow the device.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#7c3aed" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof logoWallSchema>, LogoWallConfig> = true;
