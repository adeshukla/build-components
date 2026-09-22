import type { ConfigOf, Schema } from "@/lib/schema";
import type { TourConfig } from "./react/tour";

export const tourSchema = [
  { key: "startText", label: "Start button text", group: "Content", type: "text", default: "Take the tour", maxLength: 40 },
  {
    key: "steps",
    label: "Steps",
    description: "Target is a CSS selector for the element the step points at, e.g. #search. Steps whose target isn't on the page are skipped.",
    group: "Content",
    type: "list",
    default: [
      { target: "#tour-search", title: "Search everything", body: "Find pages, people and settings from here." },
      { target: "#tour-new", title: "Start something new", body: "Create a project. You can invite people once it exists." },
      { target: "#tour-filters", title: "Narrow the list", body: "Show only the projects you need right now." },
      { target: "#tour-help", title: "Help is here", body: "Guides and contact details, whenever you need them." },
    ],
    fields: [
      { key: "target", label: "Target", maxLength: 80 },
      { key: "title", label: "Title", maxLength: 60 },
      { key: "body", label: "Text", maxLength: 200 },
    ],
    maxItems: 10,
    itemLabel: "Step",
  },
  { key: "showProgress", label: "Step count", description: "“Step 2 of 4” above each step.", group: "Add-ons", type: "boolean", default: true },
  {
    key: "showDemo",
    label: "Example app bar",
    description: "Something to point the demo at. Turn it off once the steps point at your own page.",
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
    description: "The ring round each target, the Next button and the focus ring.",
    group: "Style",
    type: "color",
    default: "#2563eb",
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof tourSchema>, TourConfig> = true;
