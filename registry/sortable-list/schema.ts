import type { ConfigOf, Schema } from "@/lib/schema";
import type { SortableListConfig } from "./react/sortable-list";

export const sortableListSchema = [
  {
    key: "label",
    label: "Name",
    description: "Shown above the list, and names it for screen readers.",
    group: "Content",
    type: "text",
    default: "Your priorities",
    maxLength: 60,
  },
  {
    key: "hint",
    label: "Hint",
    description: "Under the name. Leave empty to drop it.",
    group: "Content",
    type: "text",
    default: "Drag a handle, or press Space on it and use the arrow keys.",
    maxLength: 160,
  },
  {
    key: "items",
    label: "Items",
    description: "In their starting order.",
    group: "Content",
    type: "list",
    default: [
      { label: "Fix the checkout bug" },
      { label: "Write release notes" },
      { label: "Review the design system PR" },
      { label: "Plan next sprint" },
      { label: "Update dependencies" },
    ],
    fields: [{ key: "label", label: "Text", maxLength: 80 }],
    maxItems: 20,
    itemLabel: "Item",
  },
  {
    key: "moveButtons",
    label: "Move up and down buttons",
    description: "A way to reorder without dragging, which WCAG 2.2 asks for. Keep it unless you offer another.",
    group: "Add-ons",
    type: "boolean",
    default: true,
  },
  {
    key: "numbered",
    label: "Numbers",
    description: "Shows each item's position.",
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
    description: "The outline of the item being moved, and the focus ring.",
    group: "Style",
    type: "color",
    default: "#2563eb",
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof sortableListSchema>, SortableListConfig> = true;
