import type { ConfigOf, Schema } from "@/lib/schema";
import type { TextareaCounterConfig } from "./react/textarea-counter";

export const textareaCounterSchema = [
  { key: "label", label: "Label", group: "Content", type: "text", default: "What went wrong?", maxLength: 60 },
  {
    key: "hint",
    label: "Hint",
    description: "Leave it empty for no hint.",
    group: "Content",
    type: "text",
    default: "Anything you can tell us helps: what you were doing, what you expected.",
    maxLength: 160,
  },
  { key: "placeholder", label: "Placeholder", description: "Usually better left empty — a hint is read out, a placeholder is not.", group: "Content", type: "text", default: "", maxLength: 80 },
  { key: "name", label: "Field name", group: "Behaviour", type: "text", default: "details", maxLength: 40 },
  { key: "rows", label: "Rows", group: "Style", type: "number", default: 4, min: 2, max: 20 },
  { key: "maxLength", label: "Limit (characters)", group: "Behaviour", type: "number", default: 200, min: 20, max: 4000 },
  {
    key: "allowOver",
    label: "Let them go over",
    description: "On, pasting a long answer shows an error to fix. Off, the browser stops the typing at the limit.",
    group: "Behaviour",
    type: "boolean",
    default: true,
  },
  {
    key: "warnAt",
    label: "Warn with this many left",
    description: "Where the counter starts to stand out, and the point it is read out.",
    group: "Behaviour",
    type: "number",
    default: 40,
    min: 0,
    max: 500,
  },
  { key: "overText", label: "Over-limit message", group: "Content", type: "text", default: "That is over the limit. Shorten it before sending.", maxLength: 120 },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#1d4ed8" },
  {
    key: "leftOne",
    label: "One left",
    description: "Said with one character to go.",
    group: "Words",
    type: "text",
    default: "{count} character left",
    maxLength: 80,
  },
  {
    key: "leftMany",
    label: "Several left",
    description: "Said with more to go. {count} is how many.",
    group: "Words",
    type: "text",
    default: "{count} characters left",
    maxLength: 80,
  },
  {
    key: "overOne",
    label: "One over",
    description: "Said one character over the limit.",
    group: "Words",
    type: "text",
    default: "{count} character over the limit",
    maxLength: 80,
  },
  {
    key: "overMany",
    label: "Several over",
    description: "Said more than one over. {count} is how many.",
    group: "Words",
    type: "text",
    default: "{count} characters over the limit",
    maxLength: 80,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof textareaCounterSchema>, TextareaCounterConfig> = true;
