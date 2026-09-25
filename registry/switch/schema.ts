import type { ConfigOf, Schema } from "@/lib/schema";
import type { SwitchConfig } from "./react/switch";

export const switchSchema = [
  { key: "label", label: "Label", group: "Content", type: "text", default: "Email notifications", maxLength: 80 },
  {
    key: "hint",
    label: "Hint",
    description: "Under the label. Leave empty to drop it.",
    group: "Content",
    type: "text",
    default: "We'll email you when someone replies.",
    maxLength: 160,
  },
  { key: "startOn", label: "Starts on", group: "Behaviour", type: "boolean", default: true },
  {
    key: "labelFirst",
    label: "Label first",
    description: "Label then switch, or switch then label.",
    group: "Style",
    type: "boolean",
    default: true,
  },
  {
    key: "showState",
    label: "Show On / Off",
    description: "In words beside the switch, so the state isn't shown by position alone.",
    group: "Add-ons",
    type: "boolean",
    default: true,
  },
  { key: "size", label: "Size", group: "Style", type: "select", default: "md", options: ["sm", "md"] },
  {
    key: "name",
    label: "Form field name",
    description: "Submits with the form when on. Leave empty to leave it out.",
    group: "Add-ons",
    type: "text",
    default: "notifications",
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
  { key: "accentColor", label: "Accent colour", description: "The track when it is on.", group: "Style", type: "color", default: "#2563eb" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof switchSchema>, SwitchConfig> = true;
