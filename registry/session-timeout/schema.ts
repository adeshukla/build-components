import type { ConfigOf, Schema } from "@/lib/schema";
import type { SessionTimeoutConfig } from "./react/session-timeout";

export const sessionTimeoutSchema = [
  {
    key: "idleSeconds",
    label: "Quiet before warning (s)",
    description: "How long with nothing happening before the warning shows.",
    group: "Behaviour",
    type: "number",
    default: 60,
    min: 5,
    max: 3600,
  },
  { key: "countdownSeconds", label: "Countdown (s)", description: "How long the warning gives them.", group: "Behaviour", type: "number", default: 30, min: 5, max: 300 },
  { key: "title", label: "Title", group: "Content", type: "text", default: "Still there?", maxLength: 60 },
  {
    key: "message",
    label: "Message",
    group: "Content",
    type: "text",
    default: "You have been quiet for a while. We will sign you out to keep the account safe.",
    maxLength: 200,
  },
  { key: "stayText", label: "Stay button", group: "Content", type: "text", default: "Stay signed in", maxLength: 40 },
  { key: "signOutText", label: "Sign out button", group: "Content", type: "text", default: "Sign out now", maxLength: 40 },
  {
    key: "watchActivity",
    label: "Reset on activity",
    description: "A click, a key or a scroll puts the clock back to the beginning.",
    group: "Behaviour",
    type: "boolean",
    default: true,
  },
  {
    key: "showTrigger",
    label: "Show the warning now button",
    description: "For trying it out. Turn it off in your own app.",
    group: "Add-ons",
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
  { key: "accentColor", label: "Accent colour", description: "The stay signed in button.", group: "Style", type: "color", default: "#1d4ed8" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof sessionTimeoutSchema>, SessionTimeoutConfig> = true;
