import type { ConfigOf, Schema } from "@/lib/schema";
import type { BadgeConfig } from "./react/badge";

export const badgeSchema = [
  {
    key: "items",
    label: "Badges",
    description: "Tone is one of neutral, info, success, warning or error. The text always says the state too.",
    group: "Content",
    type: "list",
    default: [
      { text: "Live", tone: "success" },
      { text: "In review", tone: "info" },
      { text: "Needs changes", tone: "warning" },
      { text: "Failed", tone: "error" },
      { text: "Draft", tone: "neutral" },
    ],
    fields: [
      { key: "text", label: "Text", maxLength: 40 },
      { key: "tone", label: "Tone", maxLength: 10 },
    ],
    maxItems: 12,
    itemLabel: "Badge",
  },
  { key: "variant", label: "Look", group: "Style", type: "select", default: "soft", options: ["soft", "solid", "outline"] },
  {
    key: "showDot",
    label: "Dot",
    description: "A small dot before the text, useful when badges sit in a dense table.",
    group: "Style",
    type: "boolean",
    default: true,
  },
  { key: "size", label: "Size", group: "Style", type: "select", default: "md", options: ["sm", "md"] },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof badgeSchema>, BadgeConfig> = true;
