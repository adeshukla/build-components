import type { ConfigOf, Schema } from "@/lib/schema";
import type { UnsavedChangesConfig } from "./react/unsaved-changes";

export const unsavedChangesSchema = [
  { key: "label", label: "Field label", group: "Content", type: "text", default: "Draft note", maxLength: 40 },
  { key: "placeholder", label: "Placeholder", group: "Content", type: "text", default: "Type something, then try to leave.", maxLength: 80 },
  { key: "leaveText", label: "Leave button", description: "Stands in for whatever navigates away in your app.", group: "Content", type: "text", default: "Back to all notes", maxLength: 40 },
  { key: "saveText", label: "Save button", group: "Content", type: "text", default: "Save", maxLength: 40 },
  { key: "title", label: "Dialog title", group: "Content", type: "text", default: "Leave without saving?", maxLength: 60 },
  {
    key: "message",
    label: "Dialog message",
    group: "Content",
    type: "text",
    default: "You have typed something that has not been saved. Leaving now loses it.",
    maxLength: 200,
  },
  { key: "stayText", label: "Stay button", group: "Content", type: "text", default: "Keep editing", maxLength: 40 },
  { key: "discardText", label: "Discard button", group: "Content", type: "text", default: "Discard and leave", maxLength: 40 },
  {
    key: "warnOnReload",
    label: "Warn on closing the tab",
    description: "Adds the browser's own beforeunload warning while there is something unsaved.",
    group: "Behaviour",
    type: "boolean",
    default: true,
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
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#1d4ed8" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof unsavedChangesSchema>, UnsavedChangesConfig> = true;
