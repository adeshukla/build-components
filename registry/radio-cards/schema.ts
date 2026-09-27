import type { ConfigOf, Schema } from "@/lib/schema";
import type { RadioCardsConfig } from "./react/radio-cards";

export const radioCardsSchema = [
  { key: "legend", label: "Question", group: "Content", type: "text", default: "How should we deliver it?", maxLength: 80 },
  { key: "hint", label: "Hint", description: "Leave it empty for no hint.", group: "Content", type: "text", default: "Every option is tracked and signed for.", maxLength: 120 },
  {
    key: "options",
    label: "Options",
    description: "Meta is the figure on the right (a price, a time). State is on or off; off cannot be picked.",
    group: "Content",
    type: "list",
    default: [
      { label: "Standard", note: "Three to five working days", meta: "Free", state: "on" },
      { label: "Express", note: "Next working day if ordered before 2pm", meta: "£6.50", state: "on" },
      { label: "Saturday", note: "Between 8am and 1pm", meta: "£9.00", state: "on" },
      { label: "Collect in person", note: "From the yard, once we call you", meta: "Free", state: "off" },
    ],
    fields: [
      { key: "label", label: "Label", maxLength: 40 },
      { key: "note", label: "Note", maxLength: 80 },
      { key: "meta", label: "Figure", maxLength: 20 },
      { key: "state", label: "on / off", maxLength: 3 },
    ],
    maxItems: 12,
    itemLabel: "Option",
  },
  { key: "name", label: "Field name", group: "Behaviour", type: "text", default: "delivery", maxLength: 40 },
  { key: "columns", label: "Columns on a wide screen", group: "Style", type: "select", default: "two", options: ["one", "two", "three"] },
  { key: "showTick", label: "Tick on the chosen card", group: "Style", type: "boolean", default: true },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#0f766e" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof radioCardsSchema>, RadioCardsConfig> = true;
