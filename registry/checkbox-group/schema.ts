import type { ConfigOf, Schema } from "@/lib/schema";
import type { CheckboxGroupConfig } from "./react/checkbox-group";

export const checkboxGroupSchema = [
  { key: "legend", label: "Question", group: "Content", type: "text", default: "What should we email you about?", maxLength: 80 },
  { key: "hint", label: "Hint", description: "Leave it empty for no hint.", group: "Content", type: "text", default: "Pick as many as you like. You can change this later.", maxLength: 120 },
  {
    key: "options",
    label: "Options",
    description: "The note under each one is optional.",
    group: "Content",
    type: "list",
    default: [
      { label: "Product updates", note: "New parts and changes to old ones" },
      { label: "Release notes", note: "What shipped, every fortnight" },
      { label: "Accessibility notes", note: "What we learnt testing with screen readers" },
      { label: "Offers", note: "Rarely, and never more than once a month" },
    ],
    fields: [
      { key: "label", label: "Label", maxLength: 60 },
      { key: "note", label: "Note", maxLength: 80 },
    ],
    maxItems: 20,
    itemLabel: "Option",
  },
  { key: "name", label: "Field name", description: "What the form sends for these boxes.", group: "Behaviour", type: "text", default: "topics", maxLength: 40 },
  { key: "showSelectAll", label: "Everything box", description: "Shows the mixed state when only some are ticked.", group: "Add-ons", type: "boolean", default: true },
  { key: "selectAllLabel", label: "Everything label", group: "Content", type: "text", default: "Everything", maxLength: 40 },
  { key: "showCount", label: "Count line", group: "Add-ons", type: "boolean", default: true },
  { key: "minRequired", label: "Fewest needed", description: "0 means the group is optional.", group: "Behaviour", type: "number", default: 1, min: 0, max: 20 },
  { key: "errorText", label: "Error message", group: "Content", type: "text", default: "Pick at least one topic.", maxLength: 120 },
  { key: "columns", label: "Columns on a wide screen", group: "Style", type: "select", default: "one", options: ["one", "two"] },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", description: "The ticks.", group: "Style", type: "color", default: "#1d4ed8" },
  {
    key: "countText",
    label: "Count",
    description: "Said as boxes are ticked. {count} and {total} are counts.",
    group: "Words",
    type: "text",
    default: "{count} of {total} picked",
    maxLength: 80,
  },
  {
    key: "saveText",
    label: "Button",
    description: "The button that checks the choices.",
    group: "Words",
    type: "text",
    default: "Save choices",
    maxLength: 40,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof checkboxGroupSchema>, CheckboxGroupConfig> = true;
