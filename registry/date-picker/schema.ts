import type { ConfigOf, Schema } from "@/lib/schema";
import type { DatePickerConfig } from "./react/date-picker";

export const datePickerSchema = [
  { key: "label", label: "Label", group: "Content", type: "text", default: "Date", maxLength: 60 },
  {
    key: "format",
    label: "Date format",
    group: "Behaviour",
    type: "select",
    default: "DD/MM/YYYY",
    options: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY/MM/DD", "YYYY-MM-DD"],
  },
  { key: "mode", label: "Selection", group: "Behaviour", type: "select", default: "single", options: ["single", "range"] },
  {
    key: "weekStartsOn",
    label: "Week starts on",
    group: "Behaviour",
    type: "select",
    default: "monday",
    options: ["monday", "sunday"],
  },
  { key: "clearButton", label: "Clear button", group: "Add-ons", type: "boolean", default: false },
  { key: "todayButton", label: "Today button", group: "Add-ons", type: "boolean", default: false },
  { key: "helperText", label: "Helper text", group: "Add-ons", type: "boolean", default: false },
  {
    key: "helperTextContent",
    label: "Helper text content",
    group: "Add-ons",
    type: "text",
    default: "Select or type a date.",
    maxLength: 120,
    dependsOn: { key: "helperText", equals: true },
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#2563eb" },
  { key: "radius", label: "Corner radius (px)", group: "Style", type: "number", default: 6, min: 0, max: 16 },
  { key: "size", label: "Size", group: "Style", type: "select", default: "md", options: ["sm", "md", "lg"] },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof datePickerSchema>, DatePickerConfig> = true;
