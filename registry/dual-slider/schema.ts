import type { ConfigOf, Schema } from "@/lib/schema";
import type { DualSliderConfig } from "./react/dual-slider";

export const dualSliderSchema = [
  { key: "legend", label: "Question", group: "Content", type: "text", default: "Price range", maxLength: 80 },
  { key: "hint", label: "Hint", description: "Leave it empty for none.", group: "Content", type: "text", default: "Two sliders, one for each end. They cannot cross.", maxLength: 140 },
  { key: "lowLabel", label: "Lower label", group: "Content", type: "text", default: "Lowest price", maxLength: 40 },
  { key: "highLabel", label: "Upper label", group: "Content", type: "text", default: "Highest price", maxLength: 40 },
  { key: "name", label: "Field name", description: "The two sliders send this with Min and Max on the end.", group: "Behaviour", type: "text", default: "price", maxLength: 40 },
  { key: "min", label: "Minimum", group: "Behaviour", type: "number", default: 0, min: -100000, max: 100000 },
  { key: "max", label: "Maximum", group: "Behaviour", type: "number", default: 500, min: -100000, max: 1000000 },
  { key: "step", label: "Step", group: "Behaviour", type: "number", default: 10, min: 1, max: 10000 },
  { key: "minGap", label: "Smallest gap", description: "How close the two ends may get.", group: "Behaviour", type: "number", default: 20, min: 0, max: 10000 },
  { key: "startLow", label: "Lower starts at", group: "Behaviour", type: "number", default: 80, min: -100000, max: 1000000 },
  { key: "startHigh", label: "Upper starts at", group: "Behaviour", type: "number", default: 320, min: -100000, max: 1000000 },
  { key: "valuePrefix", label: "Before the number", group: "Add-ons", type: "text", default: "£", maxLength: 6 },
  { key: "valueSuffix", label: "After the number", group: "Add-ons", type: "text", default: "", maxLength: 10 },
  { key: "showBar", label: "Draw the span", group: "Add-ons", type: "boolean", default: true },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or follow the device.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#7c3aed" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof dualSliderSchema>, DualSliderConfig> = true;
