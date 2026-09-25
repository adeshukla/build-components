import type { ConfigOf, Schema } from "@/lib/schema";
import type { ShortcutHelpConfig } from "./react/shortcut-help";

export const shortcutHelpSchema = [
  {
    key: "openKey",
    label: "Opens with",
    description: "The key that brings the list up from anywhere — never while someone is typing.",
    group: "Behaviour",
    type: "select",
    default: "?",
    options: ["?", "/", "F1"],
  },
  { key: "title", label: "Title", group: "Content", type: "text", default: "Keyboard shortcuts", maxLength: 60 },
  { key: "hint", label: "Footer hint", group: "Content", type: "text", default: "Press ? at any time to bring this back.", maxLength: 120 },
  { key: "triggerText", label: "Button text", group: "Content", type: "text", default: "Keyboard shortcuts", maxLength: 40 },
  {
    key: "showTrigger",
    label: "Visible button",
    description: "A shortcut nobody can find is no help: keep a button as well.",
    group: "Add-ons",
    type: "boolean",
    default: true,
  },
  {
    key: "shortcuts",
    label: "Shortcuts",
    description: "Write a two-step shortcut as “g then h” and it is shown as two keys.",
    group: "Content",
    type: "list",
    default: [
      { keys: "?", action: "Open this list" },
      { keys: "g then h", action: "Go home" },
      { keys: "g then p", action: "Go to projects" },
      { keys: "/", action: "Jump to search" },
      { keys: "n", action: "New item" },
      { keys: "e", action: "Edit the selected item" },
      { keys: "Escape", action: "Close whatever is open" },
    ],
    fields: [
      { key: "keys", label: "Keys", maxLength: 30 },
      { key: "action", label: "What it does", maxLength: 60 },
    ],
    maxItems: 30,
    itemLabel: "Shortcut",
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
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#0f766e" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof shortcutHelpSchema>, ShortcutHelpConfig> = true;
