import type { ConfigOf, Schema } from "@/lib/schema";
import type { MenuBarConfig } from "./react/menu-bar";

export const menuBarSchema = [
  { key: "label", label: "Bar name", description: "What the whole bar is called to a screen reader.", group: "Content", type: "text", default: "Document", maxLength: 40 },
  {
    key: "items",
    label: "Items",
    description: "Items with the same menu name in a row become one menu. Leave a shortcut empty for none.",
    group: "Content",
    type: "list",
    default: [
      { menu: "File", item: "New draft", shortcut: "Ctrl N" },
      { menu: "File", item: "Open recent", shortcut: "" },
      { menu: "File", item: "Export as Markdown", shortcut: "" },
      { menu: "Edit", item: "Undo", shortcut: "Ctrl Z" },
      { menu: "Edit", item: "Redo", shortcut: "Ctrl Y" },
      { menu: "Edit", item: "Find in document", shortcut: "Ctrl F" },
      { menu: "View", item: "Outline", shortcut: "" },
      { menu: "View", item: "Word count", shortcut: "" },
      { menu: "View", item: "Full screen", shortcut: "F11" },
    ],
    fields: [
      { key: "menu", label: "Menu", maxLength: 30 },
      { key: "item", label: "Item", maxLength: 60 },
      { key: "shortcut", label: "Shortcut", maxLength: 16 },
    ],
    maxItems: 40,
    itemLabel: "Item",
  },
  { key: "showShortcuts", label: "Show the shortcuts", group: "Add-ons", type: "boolean", default: true },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or follow the device.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#1d4ed8" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof menuBarSchema>, MenuBarConfig> = true;
