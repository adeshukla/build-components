import type { ConfigOf, Schema } from "@/lib/schema";
import type { TagInputConfig } from "./react/tag-input";

export const tagInputSchema = [
  { key: "label", label: "Label", group: "Content", type: "text", default: "Skills", maxLength: 60 },
  {
    key: "hint",
    label: "Hint",
    description: "Say how to add one. People can't guess that Enter adds a tag.",
    group: "Content",
    type: "text",
    default: "Type a skill and press Enter or comma. Backspace removes the last one.",
    maxLength: 160,
  },
  { key: "placeholder", label: "Placeholder", group: "Content", type: "text", default: "Add a skill", maxLength: 40 },
  {
    key: "startTags",
    label: "Tags at the start",
    group: "Content",
    type: "list",
    default: [{ text: "Accessibility" }, { text: "CSS" }],
    fields: [{ key: "text", label: "Text", maxLength: 40 }],
    maxItems: 20,
    itemLabel: "Tag",
  },
  { key: "maxTags", label: "Most tags allowed", group: "Behaviour", type: "number", default: 8, min: 1, max: 30 },
  { key: "allowDuplicates", label: "Allow duplicates", group: "Behaviour", type: "boolean", default: false },
  {
    key: "name",
    label: "Form field name",
    description: "Each tag submits as name[]. Leave empty to leave them out.",
    group: "Add-ons",
    type: "text",
    default: "skills",
    maxLength: 40,
  },
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
export const schemaMatchesComponent: Same<ConfigOf<typeof tagInputSchema>, TagInputConfig> = true;
