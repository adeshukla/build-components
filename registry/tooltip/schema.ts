import type { ConfigOf, Schema } from "@/lib/schema";
import type { TooltipConfig } from "./react/tooltip";

export const tooltipSchema = [
  {
    key: "triggerText",
    label: "Trigger text",
    description: "The button's own text. With the icon trigger this becomes its accessible name.",
    group: "Content",
    type: "text",
    default: "Delivery options",
    maxLength: 60,
  },
  {
    key: "text",
    label: "Tooltip text",
    description: "One short line. A tooltip must never hold a link or a button: use a popover for that.",
    group: "Content",
    type: "text",
    default: "Orders placed before 2pm are sent the same working day.",
    maxLength: 160,
  },
  {
    key: "trigger",
    label: "Trigger",
    description: "A normal button, or a question-mark icon button.",
    group: "Behaviour",
    type: "select",
    default: "button",
    options: ["button", "icon"],
  },
  {
    key: "placement",
    label: "Placement",
    description: "Which side of the trigger the tooltip sits on.",
    group: "Behaviour",
    type: "select",
    default: "top",
    options: ["top", "bottom", "left", "right"],
  },
  {
    key: "delay",
    label: "Hover delay (ms)",
    description: "How long the pointer must rest before it opens. Keyboard focus always opens it at once.",
    group: "Behaviour",
    type: "number",
    default: 150,
    min: 0,
    max: 1000,
    step: 50,
  },
  {
    key: "arrow",
    label: "Arrow",
    description: "A small pointer towards the trigger.",
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
  {
    key: "accentColor",
    label: "Accent colour",
    description: "The focus ring. Contrast-corrected before it is used.",
    group: "Style",
    type: "color",
    default: "#2563eb",
  },
  {
    key: "radius",
    label: "Corner radius (px)",
    description: "Roundness of the trigger and the tooltip.",
    group: "Style",
    type: "number",
    default: 8,
    min: 0,
    max: 20,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof tooltipSchema>, TooltipConfig> = true;
