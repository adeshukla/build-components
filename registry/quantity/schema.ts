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
  {
    key: "fewerLabel",
    label: "Minus button",
    description: "Read out for −. {label} is the label, in lower case.",
    group: "Words",
    type: "text",
    default: "Fewer {label}",
    maxLength: 60,
  },
  {
    key: "moreLabel",
    label: "Plus button",
    description: "Read out for +. {label} is the label, in lower case.",
    group: "Words",
    type: "text",
    default: "More {label}",
    maxLength: 60,
  },
  {
    key: "mostText",
    label: "At the most",
    description: "Announced. {amount} is the quantity.",
    group: "Words",
    type: "text",
    default: "{amount}. That is the most you can have.",
    maxLength: 160,
  },
  {
    key: "fewestText",
    label: "At the fewest",
    description: "Announced.",
    group: "Words",
    type: "text",
    default: "{amount}. That is the fewest you can have.",
    maxLength: 160,
  },
  {
    key: "allowedText",
    label: "Out of range",
    description: "Announced when a typed number is pulled back.",
    group: "Words",
    type: "text",
    default: "{amount}. Between {min} and {max} is allowed.",
    maxLength: 160,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof quantitySchema>, QuantityConfig> = true;
