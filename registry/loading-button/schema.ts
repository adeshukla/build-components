import type { ConfigOf, Schema } from "@/lib/schema";
import type { LoadingButtonConfig } from "./react/loading-button";

export const loadingButtonSchema = [
  { key: "idleLabel", label: "Label", group: "Content", type: "text", default: "Save changes", maxLength: 40 },
  { key: "busyLabel", label: "While working", description: "The words are what a screen reader gets; a spinner says nothing.", group: "Content", type: "text", default: "Saving…", maxLength: 40 },
  { key: "doneText", label: "When it worked", group: "Content", type: "text", default: "Changes saved.", maxLength: 100 },
  { key: "errorText", label: "When it failed", description: "Say what did not happen, so nobody has to guess whether it half worked.", group: "Content", type: "text", default: "Could not save. Nothing was changed.", maxLength: 140 },
  { key: "retryLabel", label: "Label after a failure", group: "Content", type: "text", default: "Try saving again", maxLength: 40 },
  { key: "demoMs", label: "Stand-in request takes (ms)", group: "Behaviour", type: "number", default: 1200, min: 100, max: 8000 },
  { key: "demoOutcome", label: "What the stand-in does", description: "Replace run() with your own request; this is here so you can see both paths.", group: "Behaviour", type: "select", default: "saves", options: ["saves", "fails"] },
  { key: "showSpinner", label: "Show a spinner", group: "Add-ons", type: "boolean", default: true },
  { key: "fullWidth", label: "Full width", group: "Style", type: "boolean", default: false },
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
export const schemaMatchesComponent: Same<ConfigOf<typeof loadingButtonSchema>, LoadingButtonConfig> = true;
