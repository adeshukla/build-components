import type { ConfigOf, Schema } from "@/lib/schema";
import type { OfflineBannerConfig } from "./react/offline-banner";

export const offlineBannerSchema = [
  {
    key: "offlineText",
    label: "Offline message",
    description: "Say what still works and what is being kept, not just that something is wrong.",
    group: "Content",
    type: "text",
    default: "You are offline. Anything you change is kept on this device until the connection is back.",
    maxLength: 160,
  },
  { key: "onlineText", label: "Back online message", group: "Content", type: "text", default: "Back online.", maxLength: 80 },
  { key: "retryText", label: "Retry button", group: "Content", type: "text", default: "Try again", maxLength: 30 },
  {
    key: "showRetry",
    label: "Retry button",
    description: "navigator.onLine only knows about the network, so a manual check is worth having.",
    group: "Add-ons",
    type: "boolean",
    default: true,
  },
  { key: "position", label: "Position", group: "Style", type: "select", default: "top", options: ["top", "bottom", "inline"] },
  {
    key: "demoToggle",
    label: "Pretend button",
    description: "For trying it out without pulling the plug. Turn it off in your own app.",
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
  { key: "accentColor", label: "Banner colour", group: "Style", type: "color", default: "#b45309" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof offlineBannerSchema>, OfflineBannerConfig> = true;
