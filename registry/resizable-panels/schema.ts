import type { ConfigOf, Schema } from "@/lib/schema";
import type { ResizablePanelsConfig } from "./react/resizable-panels";

export const resizablePanelsSchema = [
  {
    key: "label",
    label: "Divider name",
    description: "What a screen reader calls the divider. Say what it resizes.",
    group: "Content",
    type: "text",
    default: "Resize the file list",
    maxLength: 60,
  },
  { key: "firstTitle", label: "First panel title", group: "Content", type: "text", default: "Files", maxLength: 40 },
  {
    key: "firstBody",
    label: "First panel text",
    description: "Example content. Put your own in the code.",
    group: "Content",
    type: "text",
    default: "Drag the divider, or focus it and use the arrow keys. Enter collapses this panel and brings it back.",
    maxLength: 200,
  },
  { key: "secondTitle", label: "Second panel title", group: "Content", type: "text", default: "Preview", maxLength: 40 },
  {
    key: "secondBody",
    label: "Second panel text",
    group: "Content",
    type: "text",
    default: "This panel takes whatever room is left. Both panels keep their content readable at every size.",
    maxLength: 200,
  },
  {
    key: "orientation",
    label: "Layout",
    description: "Side by side, or one above the other.",
    group: "Behaviour",
    type: "select",
    default: "horizontal",
    options: ["horizontal", "vertical"],
  },
  { key: "startSize", label: "Starting size (%)", description: "Of the first panel.", group: "Behaviour", type: "number", default: 35, min: 5, max: 95 },
  { key: "minSize", label: "Smallest (%)", group: "Behaviour", type: "number", default: 20, min: 5, max: 95 },
  { key: "maxSize", label: "Largest (%)", group: "Behaviour", type: "number", default: 70, min: 5, max: 95 },
  { key: "step", label: "Arrow key step (%)", group: "Behaviour", type: "number", default: 5, min: 1, max: 25 },
  {
    key: "collapsible",
    label: "Collapsible",
    description: "Enter (or a double-click) hides the first panel and brings it back at its last size.",
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
    description: "The divider while it is hovered or focused.",
    group: "Style",
    type: "color",
    default: "#2563eb",
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof resizablePanelsSchema>, ResizablePanelsConfig> = true;
