import type { ConfigOf, Schema } from "@/lib/schema";
import type { QuantityConfig } from "./react/quantity";

export const quantitySchema = [
  { key: "label", label: "Label", group: "Content", type: "text", default: "Quantity", maxLength: 60 },
  { key: "hint", label: "Hint", description: "Under the label. Leave empty to drop it.", group: "Content", type: "text", default: "", maxLength: 160 },
  { key: "start", label: "Starting number", group: "Behaviour", type: "number", default: 1, min: 0, max: 999 },
  { key: "min", label: "Fewest", group: "Behaviour", type: "number", default: 1, min: 0, max: 999 },
  { key: "max", label: "Most", group: "Behaviour", type: "number", default: 10, min: 1, max: 999 },
  { key: "step", label: "Step", group: "Behaviour", type: "number", default: 1, min: 1, max: 100 },
  {
    key: "unit",
    label: "Unit",
    description: "Said after the number, e.g. “kg”. Leave empty for a plain count.",
    group: "Content",
    type: "text",
    default: "",
    maxLength: 20,
  },
  { key: "name", label: "Form field name", group: "Add-ons", type: "text", default: "quantity", maxLength: 40 },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", description: "The focus ring.", group: "Style", type: "color", default: "#2563eb" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof quantitySchema>, QuantityConfig> = true;
