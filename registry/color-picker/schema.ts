import type { ConfigOf, Schema } from "@/lib/schema";
import type { ColorPickerConfig } from "./react/color-picker";

export const colorPickerSchema = [
  { key: "label", label: "Label", group: "Content", type: "text", default: "Label colour", maxLength: 60 },
  {
    key: "swatches",
    label: "Swatches",
    description: "Name each colour: “Ocean” is something a screen reader can say, #2563eb is not.",
    group: "Content",
    type: "list",
    default: [
      { name: "Slate", hex: "#475569" },
      { name: "Ocean", hex: "#2563eb" },
      { name: "Moss", hex: "#15803d" },
      { name: "Amber", hex: "#b45309" },
      { name: "Rose", hex: "#be123c" },
      { name: "Plum", hex: "#7c3aed" },
    ],
    fields: [
      { key: "name", label: "Name", maxLength: 30 },
      { key: "hex", label: "Hex", maxLength: 7 },
    ],
    maxItems: 16,
    itemLabel: "Swatch",
  },
  { key: "startHex", label: "Chosen at the start", group: "Behaviour", type: "text", default: "#2563eb", maxLength: 7 },
  {
    key: "allowCustom",
    label: "Any other colour",
    description: "Adds the browser's own colour picker, which brings its own keyboard support.",
    group: "Add-ons",
    type: "boolean",
    default: true,
  },
  { key: "showHex", label: "Show the hex code", group: "Add-ons", type: "boolean", default: true },
  { key: "name", label: "Form field name", group: "Add-ons", type: "text", default: "colour", maxLength: 40 },
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
    key: "otherText",
    label: "Any other colour",
    description: "Labels the custom colour well.",
    group: "Words",
    type: "text",
    default: "Any other colour",
    maxLength: 60,
  },
  {
    key: "chosenText",
    label: "Chosen",
    description: "Shown before the chosen colour.",
    group: "Words",
    type: "text",
    default: "Chosen:",
    maxLength: 30,
  },
  {
    key: "namedText",
    label: "Named colour picked",
    description: "Said for a named colour. {name} and {colour} are filled in.",
    group: "Words",
    type: "text",
    default: "{name} chosen, {colour}.",
    maxLength: 80,
  },
  {
    key: "customText",
    label: "Own colour picked",
    description: "Said for a custom colour. {colour} is its code.",
    group: "Words",
    type: "text",
    default: "Colour {colour} chosen.",
    maxLength: 80,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof colorPickerSchema>, ColorPickerConfig> = true;
