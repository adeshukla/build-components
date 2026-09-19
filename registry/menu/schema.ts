import type { ConfigOf, Schema } from "@/lib/schema";
import type { MenuConfig } from "./react/menu";

export const menuSchema = [
  {
    key: "buttonText",
    label: "Button text",
    description: "What opens the menu. It also names the menu for screen readers.",
    group: "Content",
    type: "text",
    default: "Actions",
    maxLength: 40,
  },
  {
    key: "items",
    label: "Menu items",
    description: "One row per item. Leave the link empty for an action your own code handles.",
    group: "Content",
    type: "list",
    default: [
      { label: "Edit details", href: "" },
      { label: "Duplicate", href: "" },
      { label: "Move to archive", href: "" },
      { label: "Open in a new tab", href: "/preview" },
      { label: "Delete", href: "" },
    ],
    fields: [
      { key: "label", label: "Text", maxLength: 60 },
      { key: "href", label: "Link (optional)", maxLength: 200, format: "url" },
    ],
    maxItems: 12,
    itemLabel: "Item",
  },
  {
    key: "align",
    label: "Align",
    description: "Which edge of the button the menu lines up with.",
    group: "Behaviour",
    type: "select",
    default: "start",
    options: ["start", "end"],
  },
  {
    key: "typeAhead",
    label: "Type to jump",
    description: "Typing letters while the menu is open jumps to the next item that starts with them.",
    group: "Behaviour",
    type: "boolean",
    default: true,
  },
  {
    key: "chevron",
    label: "Chevron",
    description: "A small arrow on the button that turns when the menu opens.",
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
  {
    key: "accentColor",
    label: "Accent colour",
    description: "Focus rings. Contrast-corrected before it is used.",
    group: "Style",
    type: "color",
    default: "#2563eb",
  },
  {
    key: "radius",
    label: "Corner radius (px)",
    description: "Roundness of the button and the menu.",
    group: "Style",
    type: "number",
    default: 10,
    min: 0,
    max: 24,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof menuSchema>, MenuConfig> = true;
