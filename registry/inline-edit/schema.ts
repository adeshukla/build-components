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
  {
    key: "editText",
    label: "Edit",
    description: "The button that opens the field.",
    group: "Words",
    type: "text",
    default: "Edit",
    maxLength: 30,
  },
  {
    key: "saveText",
    label: "Save",
    description: "The button that keeps the change.",
    group: "Words",
    type: "text",
    default: "Save",
    maxLength: 30,
  },
  {
    key: "cancelText",
    label: "Cancel",
    description: "The button that drops the change.",
    group: "Words",
    type: "text",
    default: "Cancel",
    maxLength: 30,
  },
  {
    key: "notSetText",
    label: "Not set",
    description: "Shown while there is no value.",
    group: "Words",
    type: "text",
    default: "Not set",
    maxLength: 40,
  },
  {
    key: "currentlyText",
    label: "Edit button, read out",
    description: "Read out after Edit. {label} and {value} are filled in.",
    group: "Words",
    type: "text",
    default: "{label}, currently {value}",
    maxLength: 80,
  },
  {
    key: "savedText",
    label: "Saved",
    description: "Said after saving. {label} and {value} are filled in.",
    group: "Words",
    type: "text",
    default: "Saved. {label} is now {value}.",
    maxLength: 120,
  },
  {
    key: "cancelledText",
    label: "Cancelled",
    description: "Said after cancelling.",
    group: "Words",
    type: "text",
    default: "Edit cancelled. Nothing changed.",
    maxLength: 120,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof inlineEditSchema>, InlineEditConfig> = true;
