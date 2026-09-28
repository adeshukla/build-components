import type { ConfigOf, Schema } from "@/lib/schema";
import type { PullQuoteConfig } from "./react/pull-quote";

export const pullQuoteSchema = [
  { key: "quote", label: "The quotation", group: "Content", type: "text", default: "The first thing a screen reader tells you about a button is its name. Almost nothing else about it matters as much.", maxLength: 400 },
  { key: "attribution", label: "Who said it", description: "Goes in the caption, never inside the quotation.", group: "Content", type: "text", default: "Léonie Watson", maxLength: 80 },
  { key: "source", label: "Where it is from", description: "The work, not the person. Leave it empty for none.", group: "Content", type: "text", default: "Accessibility, from the ground up", maxLength: 120 },
  { key: "sourceHref", label: "Source links to", description: "http or https only. Also becomes the blockquote's cite.", group: "Content", type: "text", format: "url", default: "", maxLength: 300 },
  { key: "showMarks", label: "Quotation marks", description: "Decoration: a blockquote is already announced as a quote.", group: "Add-ons", type: "boolean", default: true },
  { key: "align", label: "Alignment", description: "Left keeps the accent rule; centred drops it.", group: "Style", type: "select", default: "left", options: ["left", "centre"] },
  { key: "size", label: "Size", group: "Style", type: "select", default: "large", options: ["large", "huge"] },
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
export const schemaMatchesComponent: Same<ConfigOf<typeof pullQuoteSchema>, PullQuoteConfig> = true;
