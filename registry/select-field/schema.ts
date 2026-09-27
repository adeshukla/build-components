import type { ConfigOf, Schema } from "@/lib/schema";
import type { SelectFieldConfig } from "./react/select-field";

export const selectFieldSchema = [
  { key: "label", label: "Label", group: "Content", type: "text", default: "Which yard?", maxLength: 60 },
  { key: "hint", label: "Hint", description: "Leave it empty for no hint.", group: "Content", type: "text", default: "Where the work will be done.", maxLength: 120 },
  {
    key: "options",
    label: "Options",
    description: "Options sharing a group name are put in an optgroup. Leave the group empty for a flat list.",
    group: "Content",
    type: "list",
    default: [
      { label: "Falmouth", group: "South west" },
      { label: "Plymouth", group: "South west" },
      { label: "Lymington", group: "South coast" },
      { label: "Chichester", group: "South coast" },
      { label: "Whitby", group: "North east" },
    ],
    fields: [
      { key: "label", label: "Option", maxLength: 60 },
      { key: "group", label: "Group", maxLength: 40 },
    ],
    maxItems: 60,
    itemLabel: "Option",
  },
  { key: "placeholder", label: "First, empty option", description: "What it says before anything is chosen.", group: "Content", type: "text", default: "Choose a yard", maxLength: 60 },
  { key: "name", label: "Field name", group: "Behaviour", type: "text", default: "yard", maxLength: 40 },
  { key: "required", label: "Needed", group: "Behaviour", type: "boolean", default: true },
  { key: "errorText", label: "Error message", group: "Content", type: "text", default: "Choose a yard before carrying on.", maxLength: 120 },
  { key: "size", label: "Size", group: "Style", type: "select", default: "md", options: ["sm", "md"] },
  { key: "width", label: "Width", group: "Style", type: "select", default: "full", options: ["full", "auto"] },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", description: "Focus ring.", group: "Style", type: "color", default: "#1d4ed8" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof selectFieldSchema>, SelectFieldConfig> = true;
