import type { ConfigOf, Schema } from "@/lib/schema";
import type { EmptyStateConfig } from "./react/empty-state";

export const emptyStateSchema = [
  { key: "icon", label: "Icon", group: "Style", type: "select", default: "search", options: ["box", "search", "inbox", "warning"] },
  {
    key: "title",
    label: "Title",
    description: "Say what is missing, in words the visitor would use.",
    group: "Content",
    type: "text",
    default: "No results for that search",
    maxLength: 80,
  },
  {
    key: "body",
    label: "Message",
    description: "Say what to do next. An empty screen with no way forward is a dead end.",
    group: "Content",
    type: "text",
    default: "Check the spelling, or try a shorter word. You can also clear the filters and start again.",
    maxLength: 240,
  },
  { key: "actionText", label: "Main action", description: "Leave empty to drop it.", group: "Content", type: "text", default: "Clear filters", maxLength: 40 },
  { key: "actionUrl", label: "Main action link", group: "Content", type: "text", default: "/search", maxLength: 200, format: "url" },
  { key: "secondaryText", label: "Second action", group: "Content", type: "text", default: "Browse everything", maxLength: 40 },
  { key: "secondaryUrl", label: "Second action link", group: "Content", type: "text", default: "/all", maxLength: 200, format: "url" },
  {
    key: "headingLevel",
    label: "Heading level",
    description: "Pick the level that follows the heading above it on your page.",
    group: "Behaviour",
    type: "select",
    default: "h2",
    options: ["h2", "h3"],
  },
  { key: "align", label: "Alignment", group: "Style", type: "select", default: "center", options: ["center", "left"] },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", description: "The main action.", group: "Style", type: "color", default: "#2563eb" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof emptyStateSchema>, EmptyStateConfig> = true;
