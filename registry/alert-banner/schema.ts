import type { ConfigOf, Schema } from "@/lib/schema";
import type { AlertBannerConfig } from "./react/alert-banner";

export const alertBannerSchema = [
  {
    key: "tone",
    label: "Tone",
    description: "Sets the word a screen reader hears first, the icon, the colour, and whether it interrupts.",
    group: "Behaviour",
    type: "select",
    default: "warning",
    options: ["info", "success", "warning", "error"],
  },
  { key: "title", label: "Title", group: "Content", type: "text", default: "Your card expires next month", maxLength: 120 },
  {
    key: "body",
    label: "Message",
    description: "Say what to do about it. Leave empty for a one-line banner.",
    group: "Content",
    type: "text",
    default: "Update it before 30 June so your subscription doesn't stop.",
    maxLength: 240,
  },
  { key: "actionText", label: "Action text", description: "Leave empty to drop the link.", group: "Content", type: "text", default: "Update card", maxLength: 40 },
  { key: "actionUrl", label: "Action link", group: "Content", type: "text", default: "/billing", maxLength: 200, format: "url" },
  {
    key: "dismissible",
    label: "Can be dismissed",
    description: "Only for messages that are safe to miss. Errors people must act on should stay.",
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
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof alertBannerSchema>, AlertBannerConfig> = true;
