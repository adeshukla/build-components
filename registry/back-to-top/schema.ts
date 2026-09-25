import type { ConfigOf, Schema } from "@/lib/schema";
import type { BackToTopConfig } from "./react/back-to-top";

export const backToTopSchema = [
  { key: "text", label: "Text", group: "Content", type: "text", default: "Back to top", maxLength: 40 },
  {
    key: "showAfter",
    label: "Appears after (px)",
    description: "How far down the page before it is worth showing.",
    group: "Behaviour",
    type: "number",
    default: 400,
    min: 0,
    max: 4000,
  },
  { key: "position", label: "Corner", group: "Style", type: "select", default: "right", options: ["right", "left"] },
  {
    key: "showLabel",
    label: "Show the words",
    description: "With this off it is an arrow only, but the words are still read out.",
    group: "Style",
    type: "boolean",
    default: true,
  },
  {
    key: "targetId",
    label: "Focus lands on",
    description: "The id to focus after scrolling, e.g. a skip-link target. Empty means the page's first heading.",
    group: "Behaviour",
    type: "text",
    default: "",
    maxLength: 60,
  },
  {
    key: "showDemo",
    label: "Example page",
    description: "Something to scroll past, so the button has a reason to appear. Turn it off in your own page.",
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
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#25154d" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof backToTopSchema>, BackToTopConfig> = true;
