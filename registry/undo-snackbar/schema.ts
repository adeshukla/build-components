import type { ConfigOf, Schema } from "@/lib/schema";
import type { UndoSnackbarConfig } from "./react/undo-snackbar";

export const undoSnackbarSchema = [
  { key: "triggerLabel", label: "The action", group: "Content", type: "text", default: "Archive this message", maxLength: 60 },
  { key: "message", label: "What happened", group: "Content", type: "text", default: "Message archived.", maxLength: 100 },
  { key: "undoLabel", label: "Undo button", group: "Content", type: "text", default: "Undo", maxLength: 30 },
  { key: "closeLabel", label: "Dismiss button name", description: "It shows ×; this is what it is called.", group: "Content", type: "text", default: "Dismiss", maxLength: 40 },
  { key: "undoneText", label: "After undoing", group: "Content", type: "text", default: "Message put back.", maxLength: 100 },
  { key: "keptText", label: "After it expires", description: "Said out loud, because silence is not a result.", group: "Content", type: "text", default: "Message stayed archived.", maxLength: 100 },
  { key: "seconds", label: "Seconds before it goes", description: "Nought means it stays until dismissed, which is the safest answer for a destructive action.", group: "Behaviour", type: "number", default: 8, min: 0, max: 120 },
  { key: "showCountdown", label: "Show the seconds left", group: "Add-ons", type: "boolean", default: true },
  { key: "position", label: "Position", group: "Style", type: "select", default: "bottom-left", options: ["bottom-left", "bottom-centre"] },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or follow the device.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#e6b24a" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof undoSnackbarSchema>, UndoSnackbarConfig> = true;
