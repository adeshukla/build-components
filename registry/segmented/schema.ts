import type { ConfigOf, Schema } from "@/lib/schema";
import type { SegmentedConfig } from "./react/segmented";

export const segmentedSchema = [
  { key: "legend", label: "Group label", description: "What is being chosen, e.g. “View”.", group: "Content", type: "text", default: "View", maxLength: 60 },
  {
    key: "hideLegend",
    label: "Hide the label",
    description: "Still read out; only hidden on screen. Use when the surrounding text already says it.",
    group: "Style",
    type: "boolean",
    default: false,
  },
  {
    key: "options",
    label: "Choices",
    group: "Content",
    type: "list",
    default: [{ label: "List" }, { label: "Board" }, { label: "Calendar" }],
    fields: [{ key: "label", label: "Text", maxLength: 40 }],
    maxItems: 6,
    itemLabel: "Choice",
  },
  { key: "startIndex", label: "Picked at the start", description: "0 is the first choice.", group: "Behaviour", type: "number", default: 0, min: 0, max: 5 },
  { key: "size", label: "Size", group: "Style", type: "select", default: "md", options: ["sm", "md"] },
  { key: "fullWidth", label: "Full width", group: "Style", type: "boolean", default: false },
  { key: "name", label: "Form field name", group: "Add-ons", type: "text", default: "view", maxLength: 40 },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", description: "The picked segment.", group: "Style", type: "color", default: "#25154d" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof segmentedSchema>, SegmentedConfig> = true;
