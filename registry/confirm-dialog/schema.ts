import type { ConfigOf, Schema } from "@/lib/schema";
import type { ConfirmDialogConfig } from "./react/confirm-dialog";

export const confirmDialogSchema = [
  { key: "triggerText", label: "Button text", group: "Content", type: "text", default: "Delete workspace", maxLength: 40 },
  { key: "title", label: "Title", group: "Content", type: "text", default: "Delete this workspace?", maxLength: 80 },
  {
    key: "message",
    label: "Message",
    description: "Say what is lost and whether it can be undone.",
    group: "Content",
    type: "text",
    default: "Everything in it goes with it: boards, files and invites. This cannot be undone.",
    maxLength: 200,
  },
  {
    key: "requirePhrase",
    label: "Ask for the phrase",
    description: "Off makes it an ordinary confirm dialog.",
    group: "Behaviour",
    type: "boolean",
    default: true,
  },
  { key: "phrase", label: "Phrase to type", description: "Compared as typed, so DELETE and delete are different.", group: "Behaviour", type: "text", default: "DELETE", maxLength: 30 },
  { key: "confirmText", label: "Confirm button", group: "Content", type: "text", default: "Delete workspace", maxLength: 40 },
  { key: "cancelText", label: "Cancel button", group: "Content", type: "text", default: "Keep it", maxLength: 40 },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", description: "The destructive button.", group: "Style", type: "color", default: "#b42318" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof confirmDialogSchema>, ConfirmDialogConfig> = true;
