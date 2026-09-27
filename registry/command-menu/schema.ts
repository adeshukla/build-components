import type { ConfigOf, Schema } from "@/lib/schema";
import type { CommandMenuConfig } from "./react/command-menu";

export const commandMenuSchema = [
  { key: "triggerLabel", label: "Button label", description: "Also names the dialog and the list inside it.", group: "Content", type: "text", default: "Commands", maxLength: 40 },
  { key: "placeholder", label: "Field placeholder", description: "Also the field's own label, which is there but not shown.", group: "Content", type: "text", default: "Type a command", maxLength: 60 },
  {
    key: "commands",
    label: "Commands",
    description: "Commands with the same group name in a row are shown under one heading. Leave a shortcut empty for none.",
    group: "Content",
    type: "list",
    default: [
      { group: "This page", label: "Copy the React file", shortcut: "C" },
      { group: "This page", label: "Copy the install command", shortcut: "I" },
      { group: "This page", label: "Reset every option", shortcut: "R" },
      { group: "Go to", label: "Parts catalogue", shortcut: "G then P" },
      { group: "Go to", label: "Accessibility statement", shortcut: "G then A" },
      { group: "Appearance", label: "Switch to dark", shortcut: "" },
      { group: "Appearance", label: "Follow the device", shortcut: "" },
    ],
    fields: [
      { key: "group", label: "Group", maxLength: 30 },
      { key: "label", label: "Command", maxLength: 60 },
      { key: "shortcut", label: "Shortcut", maxLength: 16 },
    ],
    maxItems: 40,
    itemLabel: "Command",
  },
  { key: "hotkey", label: "Opens with Ctrl or ⌘ and", description: "One letter. Leave it empty for no shortcut.", group: "Behaviour", type: "text", default: "k", maxLength: 1 },
  { key: "emptyText", label: "When nothing matches", group: "Content", type: "text", default: "No command matches that.", maxLength: 100 },
  { key: "showShortcuts", label: "Show each shortcut", group: "Add-ons", type: "boolean", default: true },
  { key: "showHint", label: "Show the shortcut on the button", group: "Add-ons", type: "boolean", default: true },
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
export const schemaMatchesComponent: Same<ConfigOf<typeof commandMenuSchema>, CommandMenuConfig> = true;
