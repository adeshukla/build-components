import type { ConfigOf, Schema } from "@/lib/schema";
import type { ToggleGroupConfig } from "./react/toggle-group";

export const toggleGroupSchema = [
  { key: "legend", label: "Question", group: "Content", type: "text", default: "Which days do you work?", maxLength: 80 },
  { key: "hint", label: "Hint", description: "Leave it empty for none.", group: "Content", type: "text", default: "Pick every day that applies.", maxLength: 120 },
  {
    key: "options",
    label: "Options",
    description: "The value is what the form sends; leave it empty to send the label.",
    group: "Content",
    type: "list",
    default: [
      { label: "Mon", value: "monday" },
      { label: "Tue", value: "tuesday" },
      { label: "Wed", value: "wednesday" },
      { label: "Thu", value: "thursday" },
      { label: "Fri", value: "friday" },
      { label: "Sat", value: "saturday" },
      { label: "Sun", value: "sunday" },
    ],
    fields: [
      { key: "label", label: "Label", maxLength: 30 },
      { key: "value", label: "Value", maxLength: 40 },
    ],
    maxItems: 24,
    itemLabel: "Option",
  },
  { key: "name", label: "Field name", group: "Behaviour", type: "text", default: "days", maxLength: 40 },
  { key: "minOne", label: "Keep at least one on", description: "The last one left refuses to turn off, and says why.", group: "Behaviour", type: "boolean", default: true },
  { key: "showCount", label: "Count line", group: "Add-ons", type: "boolean", default: true },
  { key: "size", label: "Size", group: "Style", type: "select", default: "md", options: ["sm", "md"] },
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
    key: "noneText",
    label: "Nothing picked",
    description: "Said while nothing is on.",
    group: "Words",
    type: "text",
    default: "Nothing picked",
    maxLength: 80,
  },
  {
    key: "pickedText",
    label: "Picked",
    description: "Said while some are on. {count} is how many, {choices} which.",
    group: "Words",
    type: "text",
    default: "{count} picked: {choices}",
    maxLength: 120,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof toggleGroupSchema>, ToggleGroupConfig> = true;
