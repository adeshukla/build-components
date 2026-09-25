import type { ConfigOf, Schema } from "@/lib/schema";
import type { ReadingProgressConfig } from "./react/reading-progress";

export const readingProgressSchema = [
  {
    key: "label",
    label: "Bar label",
    description: "What the bar is measuring, for screen readers.",
    group: "Content",
    type: "text",
    default: "Reading progress",
    maxLength: 60,
  },
  { key: "showBar", label: "Progress bar", group: "Add-ons", type: "boolean", default: true },
  { key: "showContents", label: "Contents list", description: "Marks the heading you are currently in.", group: "Add-ons", type: "boolean", default: true },
  { key: "contentsTitle", label: "Contents heading", group: "Content", type: "text", default: "On this page", maxLength: 40 },
  {
    key: "sections",
    label: "Sections",
    description: "Each one needs a heading on the page with a matching id (lower case, dashes for spaces).",
    group: "Content",
    type: "list",
    default: [
      { title: "What this is" },
      { title: "Getting started" },
      { title: "Options" },
      { title: "Accessibility notes" },
    ],
    fields: [{ key: "title", label: "Heading", maxLength: 60 }],
    maxItems: 20,
    itemLabel: "Section",
  },
  {
    key: "showDemo",
    label: "Example sections",
    description: "Headings and text to scroll through. Turn it off once it sits with your own content.",
    group: "Add-ons",
    type: "boolean",
    default: true,
  },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", description: "The bar and the current section.", group: "Style", type: "color", default: "#2563eb" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof readingProgressSchema>, ReadingProgressConfig> = true;
