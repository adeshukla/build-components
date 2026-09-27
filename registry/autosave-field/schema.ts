import type { ConfigOf, Schema } from "@/lib/schema";
import type { AutosaveFieldConfig } from "./react/autosave-field";

export const autosaveFieldSchema = [
  { key: "label", label: "Label", group: "Content", type: "text", default: "Notes", maxLength: 60 },
  { key: "hint", label: "Hint", description: "Leave it empty for none.", group: "Content", type: "text", default: "Saved on its own a moment after you stop typing.", maxLength: 140 },
  { key: "name", label: "Field name", group: "Behaviour", type: "text", default: "notes", maxLength: 40 },
  { key: "rows", label: "Rows", group: "Style", type: "number", default: 5, min: 2, max: 20 },
  { key: "maxLength", label: "Character limit", group: "Behaviour", type: "number", default: 2000, min: 50, max: 20000 },
  { key: "pauseMs", label: "Pause before saving (ms)", description: "How long a rest in the typing has to be before it saves.", group: "Behaviour", type: "number", default: 900, min: 200, max: 5000 },
  { key: "demoOutcome", label: "What the stand-in save does", description: "Replace saveDraft with your own request; this is here so you can see both paths.", group: "Behaviour", type: "select", default: "saves", options: ["saves", "fails"] },
  { key: "unsavedText", label: "While typing", group: "Content", type: "text", default: "Not saved yet", maxLength: 60 },
  { key: "savingText", label: "While saving", group: "Content", type: "text", default: "Saving…", maxLength: 60 },
  { key: "savedText", label: "When saved", description: "The time is added after it.", group: "Content", type: "text", default: "Saved", maxLength: 60 },
  { key: "errorText", label: "When it fails", group: "Content", type: "text", default: "Could not save.", maxLength: 100 },
  { key: "retryLabel", label: "Retry button", group: "Content", type: "text", default: "Try again", maxLength: 40 },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or follow the device.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#0f766e" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof autosaveFieldSchema>, AutosaveFieldConfig> = true;
