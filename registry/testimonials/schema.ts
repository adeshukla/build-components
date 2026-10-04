import type { ConfigOf, Schema } from "@/lib/schema";
import type { TestimonialsConfig } from "./react/testimonials";

export const testimonialsSchema = [
  { key: "heading", label: "Heading", group: "Content", type: "text", default: "What people say", maxLength: 120 },
  { key: "headingLevel", label: "Heading level", group: "Content", type: "select", default: "h2", options: ["h2", "h3"] },
  { key: "intro", label: "Intro", description: "Leave it empty for none.", group: "Content", type: "text", default: "", maxLength: 300 },
  {
    key: "items",
    label: "Quotes",
    description: "Real words from real people, used with their permission. A quote left empty is not shown.",
    group: "Content",
    type: "list",
    default: [
      { quote: "[TODO: a customer's own words, used with their permission]", name: "[TODO: their name]", role: "[TODO: their role and company]" },
      { quote: "[TODO: a second customer's words]", name: "[TODO: their name]", role: "[TODO: their role and company]" },
      { quote: "[TODO: a third customer's words]", name: "[TODO: their name]", role: "[TODO: their role and company]" },
    ],
    fields: [
      { key: "quote", label: "Quote", maxLength: 400 },
      { key: "name", label: "Name", maxLength: 80 },
      { key: "role", label: "Role", maxLength: 120 },
    ],
    maxItems: 9,
    itemLabel: "Quote",
  },
  { key: "theme", label: "Theme", group: "Style", type: "select", default: "light", options: ["light", "dark", "system"] },
  { key: "accentColor", label: "Accent colour", description: "The quotation marks, darkened if needed to stay readable.", group: "Style", type: "color", default: "#2563eb" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof testimonialsSchema>, TestimonialsConfig> = true;
