import type { ConfigOf, Schema } from "@/lib/schema";
import type { TabsConfig } from "./react/tabs";

export const tabsSchema = [
  {
    key: "label",
    label: "Tab set name",
    description: "Announced to screen readers, so they know what this set of tabs is for.",
    group: "Content",
    type: "text",
    default: "Plan details",
    maxLength: 60,
  },
  {
    key: "items",
    label: "Tabs",
    description: "Each tab and what it shows, in this order.",
    group: "Content",
    type: "list",
    default: [
      {
        label: "Overview",
        content:
          "Everything a small team needs to ship: unlimited projects, 10 GB of storage and email support within one working day.",
      },
      {
        label: "Pricing",
        content: "£12 per person per month, billed yearly. No setup fee, and you can cancel whenever you like.",
      },
      {
        label: "Support",
        content: "Email support on working days, plus a shared channel once you pass twenty seats.",
      },
    ],
    fields: [
      { key: "label", label: "Tab text", maxLength: 40 },
      { key: "content", label: "Panel text", maxLength: 400 },
    ],
    maxItems: 6,
    itemLabel: "Tab",
  },
  {
    key: "activation",
    label: "Activation",
    description: "Automatic shows a panel as soon as the arrow keys reach its tab; manual waits for Enter or Space.",
    group: "Behaviour",
    type: "select",
    default: "automatic",
    options: ["automatic", "manual"],
  },
  {
    key: "orientation",
    label: "Direction",
    description: "Tabs in a row, or stacked down the side.",
    group: "Behaviour",
    type: "select",
    default: "horizontal",
    options: ["horizontal", "vertical"],
  },
  {
    key: "stretch",
    label: "Fill the width",
    description: "Tabs share the full width equally instead of hugging their text.",
    group: "Add-ons",
    type: "boolean",
    default: false,
  },
  {
    key: "panelBox",
    label: "Panel border",
    description: "Draws a box around the panel so it reads as one area.",
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
    description: "Marks the selected tab. Contrast-corrected before it is used as text.",
    group: "Style",
    type: "color",
    default: "#2563eb",
  },
  {
    key: "look",
    label: "Selected tab",
    description: "An underline under the tab, or a filled pill.",
    group: "Style",
    type: "select",
    default: "underline",
    options: ["underline", "pill"],
  },
  {
    key: "radius",
    label: "Corner radius (px)",
    description: "Roundness of the pills and the panel box.",
    group: "Style",
    type: "number",
    default: 8,
    min: 0,
    max: 24,
  },
  {
    key: "size",
    label: "Size",
    description: "Text size and how tall the tabs are.",
    group: "Style",
    type: "select",
    default: "md",
    options: ["sm", "md"],
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof tabsSchema>, TabsConfig> = true;
