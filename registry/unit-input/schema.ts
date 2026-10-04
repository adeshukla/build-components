import type { ConfigOf, Schema } from "@/lib/schema";
import type { UnitInputConfig } from "./react/unit-input";

export const unitInputSchema = [
  { key: "label", label: "Label", group: "Content", type: "text", default: "How long is the boat?", maxLength: 80 },
  { key: "hint", label: "Hint", description: "Leave it empty for none.", group: "Content", type: "text", default: "Overall length, to the nearest tenth.", maxLength: 120 },
  { key: "name", label: "Number field name", group: "Behaviour", type: "text", default: "length", maxLength: 40 },
  { key: "unitName", label: "Unit field name", description: "The unit is sent as its own value, not glued to the number.", group: "Behaviour", type: "text", default: "lengthUnit", maxLength: 40 },
  {
    key: "units",
    label: "Units",
    group: "Content",
    type: "list",
    default: [
      { label: "metres", value: "m" },
      { label: "feet", value: "ft" },
    ],
    fields: [
      { key: "label", label: "Label", maxLength: 30 },
      { key: "value", label: "Value", maxLength: 20 },
    ],
    maxItems: 12,
    itemLabel: "Unit",
  },
  { key: "min", label: "Smallest", group: "Behaviour", type: "number", default: 1, min: 0, max: 100000 },
  { key: "max", label: "Largest", group: "Behaviour", type: "number", default: 200, min: 1, max: 1000000 },
  { key: "step", label: "Step", group: "Behaviour", type: "number", default: 0.1, min: 0.01, max: 100 },
  { key: "errorText", label: "Error message", description: "Say the range in words; a red border says nothing.", group: "Content", type: "text", default: "Give a length between 1 and 200.", maxLength: 120 },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or follow the device.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#1d4ed8" },
  {
    key: "unitLabel",
    label: "Unit list",
    description: "Names the unit list. {label} is the label, in lower case.",
    group: "Words",
    type: "text",
    default: "Unit for {label}",
    maxLength: 80,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof unitInputSchema>, UnitInputConfig> = true;
