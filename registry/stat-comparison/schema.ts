import type { ConfigOf, Schema } from "@/lib/schema";
import type { StatComparisonConfig } from "./react/stat-comparison";

export const statComparisonSchema = [
  { key: "caption", label: "Caption", group: "Content", type: "text", default: "The two outputs, side by side", maxLength: 100 },
  { key: "metricHeader", label: "First column header", description: "Leave it empty for a blank corner; the markup still names it.", group: "Content", type: "text", default: "", maxLength: 40 },
  { key: "leftHeader", label: "First option", group: "Content", type: "text", default: "React + Tailwind", maxLength: 60 },
  { key: "rightHeader", label: "Second option", group: "Content", type: "text", default: "HTML, CSS and JS", maxLength: 60 },
  {
    key: "rows",
    label: "Rows",
    description: "Better is left, right or neither. Put real numbers here — an invented comparison is worse than none.",
    group: "Content",
    type: "list",
    default: [
      { metric: "Files to copy", left: "1", right: "2 or 3", better: "left" },
      { metric: "Runtime dependencies", left: "0", right: "0", better: "neither" },
      { metric: "Needs a build step", left: "Yes", right: "No", better: "right" },
      { metric: "Tailwind version required", left: "v4", right: "None", better: "right" },
      { metric: "Tests run against it", left: "Every one", right: "Every one", better: "neither" },
    ],
    fields: [
      { key: "metric", label: "Measure", maxLength: 60 },
      { key: "left", label: "First value", maxLength: 40 },
      { key: "right", label: "Second value", maxLength: 40 },
      { key: "better", label: "Better", maxLength: 8 },
    ],
    maxItems: 20,
    itemLabel: "Row",
  },
  { key: "showBetter", label: "Mark which is better", group: "Add-ons", type: "boolean", default: true },
  { key: "betterWord", label: "Better wording", description: "Said in words, because a tinted cell is not information.", group: "Content", type: "text", default: "Better here", maxLength: 30 },
  { key: "note", label: "Note under the table", description: "Leave it empty for none.", group: "Content", type: "text", default: "Better depends on the project. This is what differs, not which one you should pick.", maxLength: 240 },
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
    key: "measureHeader",
    label: "First column heading",
    description: "Read out for the empty corner cell when the visible heading is blank.",
    group: "Words",
    type: "text",
    default: "Measure",
    maxLength: 60,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof statComparisonSchema>, StatComparisonConfig> = true;
