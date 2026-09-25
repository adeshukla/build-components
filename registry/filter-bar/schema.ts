import type { ConfigOf, Schema } from "@/lib/schema";
import type { FilterBarConfig } from "./react/filter-bar";

export const filterBarSchema = [
  { key: "label", label: "Heading", group: "Content", type: "text", default: "Filters", maxLength: 40 },
  {
    key: "filters",
    label: "Filters",
    description: "Chips sharing a group name are shown together under it.",
    group: "Content",
    type: "list",
    default: [
      { group: "Colour", label: "Blue" },
      { group: "Colour", label: "Green" },
      { group: "Colour", label: "Sand" },
      { group: "Size", label: "Small" },
      { group: "Size", label: "Medium" },
      { group: "Size", label: "Large" },
      { group: "In stock", label: "Ready to ship" },
    ],
    fields: [
      { key: "group", label: "Group", maxLength: 30 },
      { key: "label", label: "Chip", maxLength: 30 },
    ],
    maxItems: 24,
    itemLabel: "Filter",
  },
  {
    key: "showPills",
    label: "Applied filters as pills",
    description: "A list of what is on, each with its own remove button.",
    group: "Add-ons",
    type: "boolean",
    default: true,
  },
  { key: "clearAll", label: "Clear all button", group: "Add-ons", type: "boolean", default: true },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", description: "Chips that are on.", group: "Style", type: "color", default: "#0f766e" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof filterBarSchema>, FilterBarConfig> = true;
