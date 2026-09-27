import type { ConfigOf, Schema } from "@/lib/schema";
import type { InlineConfirmConfig } from "./react/inline-confirm";

export const inlineConfirmSchema = [
  { key: "itemLabel", label: "The thing", group: "Content", type: "text", default: "Quarterly report.pdf", maxLength: 80 },
  { key: "actionLabel", label: "Action button", group: "Content", type: "text", default: "Delete", maxLength: 30 },
  { key: "question", label: "The question", description: "Name what will happen, not just \"Are you sure?\".", group: "Content", type: "text", default: "Delete this file?", maxLength: 100 },
  { key: "confirmLabel", label: "Confirm button", description: "Repeat the verb: Yes, delete. Never just \"Yes\".", group: "Content", type: "text", default: "Yes, delete", maxLength: 40 },
  { key: "cancelLabel", label: "Cancel button", group: "Content", type: "text", default: "Keep it", maxLength: 40 },
  { key: "doneText", label: "After confirming", group: "Content", type: "text", default: "Quarterly report.pdf deleted.", maxLength: 120 },
  { key: "cancelledText", label: "After cancelling", group: "Content", type: "text", default: "Nothing was deleted.", maxLength: 120 },
  { key: "focusOn", label: "Focus lands on", description: "Cancel for anything destructive, so a stray Enter does no harm.", group: "Behaviour", type: "select", default: "cancel", options: ["cancel", "confirm"] },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or follow the device.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#b42318" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof inlineConfirmSchema>, InlineConfirmConfig> = true;
