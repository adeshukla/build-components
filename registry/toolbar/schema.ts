import type { ConfigOf, Schema } from "@/lib/schema";
import type { ToolbarConfig } from "./react/toolbar";

export const toolbarSchema = [
  { key: "label", label: "Toolbar name", description: "Read out when a screen reader reaches the bar.", group: "Content", type: "text", default: "Text formatting", maxLength: 60 },
  {
    key: "items",
    label: "Items",
    description: "A toggle stays on until pressed again and reports aria-pressed; an action just happens.",
    group: "Content",
    type: "list",
    default: [
      { label: "Bold", kind: "toggle" },
      { label: "Italic", kind: "toggle" },
      { label: "Underline", kind: "toggle" },
      { label: "Undo", kind: "action" },
      { label: "Redo", kind: "action" },
      { label: "Clear formatting", kind: "action" },
    ],
    fields: [
      { key: "label", label: "Label", maxLength: 30 },
      { key: "kind", label: "toggle / action", maxLength: 6 },
    ],
    maxItems: 16,
    itemLabel: "Item",
  },
  { key: "orientation", label: "Orientation", group: "Style", type: "select", default: "horizontal", options: ["horizontal", "vertical"] },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", description: "Toggles that are on.", group: "Style", type: "color", default: "#1d4ed8" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof toolbarSchema>, ToolbarConfig> = true;
