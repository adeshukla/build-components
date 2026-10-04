import type { ConfigOf, Schema } from "@/lib/schema";
import type { ComparisonTableConfig } from "./react/comparison-table";

export const comparisonTableSchema = [
  { key: "caption", label: "Caption", description: "Read out before the table.", group: "Content", type: "text", default: "What each plan includes", maxLength: 80 },
  {
    key: "plans",
    label: "Columns",
    description: "Up to three. Anything beyond that is more of a spreadsheet than a page.",
    group: "Content",
    type: "list",
    default: [
      { name: "Solo", note: "One person" },
      { name: "Crew", note: "Up to ten" },
      { name: "Fleet", note: "Whole company" },
    ],
    fields: [
      { key: "name", label: "Name", maxLength: 30 },
      { key: "note", label: "Note", maxLength: 40 },
    ],
    maxItems: 3,
    itemLabel: "Column",
  },
  {
    key: "rows",
    label: "Rows",
    description: "Write yes or no for a tick or a cross; anything else is shown as it is.",
    group: "Content",
    type: "list",
    default: [
      { feature: "Projects", a: "1", b: "10", c: "Unlimited" },
      { feature: "File storage", a: "5 GB", b: "100 GB", c: "1 TB" },
      { feature: "Shared boards", a: "no", b: "yes", c: "yes" },
      { feature: "Single sign-on", a: "no", b: "no", c: "yes" },
      { feature: "Audit log", a: "no", b: "no", c: "yes" },
      { feature: "Email support", a: "yes", b: "yes", c: "yes" },
      { feature: "Priority support", a: "no", b: "no", c: "yes" },
    ],
    fields: [
      { key: "feature", label: "Feature", maxLength: 60 },
      { key: "a", label: "First column", maxLength: 40 },
      { key: "b", label: "Second column", maxLength: 40 },
      { key: "c", label: "Third column", maxLength: 40 },
    ],
    maxItems: 30,
    itemLabel: "Row",
  },
  { key: "highlight", label: "Highlighted column", description: "Matched by name. Leave it empty for none.", group: "Style", type: "text", default: "Crew", maxLength: 30 },
  { key: "yesText", label: "Wording for yes", group: "Content", type: "text", default: "Yes", maxLength: 20 },
  { key: "noText", label: "Wording for no", group: "Content", type: "text", default: "No", maxLength: 20 },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or follow the device.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#0f766e" },
  {
    key: "featureHeader",
    label: "First column heading",
    description: "Heads the column of features.",
    group: "Words",
    type: "text",
    default: "Feature",
    maxLength: 40,
  },
  {
    key: "featuredText",
    label: "Most picked",
    description: "Shown under the featured plan's name.",
    group: "Words",
    type: "text",
    default: "Most picked",
    maxLength: 40,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof comparisonTableSchema>, ComparisonTableConfig> = true;
