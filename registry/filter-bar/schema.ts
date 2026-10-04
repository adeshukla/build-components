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
  {
    key: "noneText",
    label: "No filters",
    description: "Said while nothing is picked.",
    group: "Words",
    type: "text",
    default: "No filters applied",
    maxLength: 80,
  },
  {
    key: "oneText",
    label: "One filter",
    description: "Said with one filter on. {count} is the number, {filters} the filter.",
    group: "Words",
    type: "text",
    default: "{count} filter applied: {filters}",
    maxLength: 120,
  },
  {
    key: "manyText",
    label: "Several filters",
    description: "Said with more than one on. {count} is the number, {filters} the filters.",
    group: "Words",
    type: "text",
    default: "{count} filters applied: {filters}",
    maxLength: 120,
  },
  {
    key: "clearText",
    label: "Clear all",
    description: "The button that turns every filter off.",
    group: "Words",
    type: "text",
    default: "Clear all",
    maxLength: 40,
  },
  {
    key: "pillsLabel",
    label: "Applied filters list",
    description: "Names the list of filters that are on, for screen readers.",
    group: "Words",
    type: "text",
    default: "Applied filters",
    maxLength: 60,
  },
  {
    key: "removeLabel",
    label: "Remove a filter",
    description: "Read out on each pill's button. {name} is the filter.",
    group: "Words",
    type: "text",
    default: "Remove filter {name}",
    maxLength: 160,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof filterBarSchema>, FilterBarConfig> = true;
