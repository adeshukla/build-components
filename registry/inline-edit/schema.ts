import type { ConfigOf, Schema } from "@/lib/schema";
import type { InlineEditConfig } from "./react/inline-edit";

export const inlineEditSchema = [
  { key: "label", label: "Label", description: "Named on the button as well, so it is never just “Edit”.", group: "Content", type: "text", default: "Project name", maxLength: 60 },
  { key: "value", label: "Value", group: "Content", type: "text", default: "Harbour redesign", maxLength: 200 },
  { key: "hint", label: "Hint", description: "Shown while editing. Leave empty to drop it.", group: "Content", type: "text", default: "Enter saves, Escape cancels.", maxLength: 120 },
  { key: "multiline", label: "Several lines", description: "Enter then makes a new line, and only Save saves.", group: "Behaviour", type: "boolean", default: false },
  { key: "required", label: "Can't be empty", group: "Behaviour", type: "boolean", default: true },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", description: "Save and the focus ring.", group: "Style", type: "color", default: "#2563eb" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof inlineEditSchema>, InlineEditConfig> = true;
