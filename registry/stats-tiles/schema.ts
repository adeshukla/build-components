import type { ConfigOf, Schema } from "@/lib/schema";
import type { StatsTilesConfig } from "./react/stats-tiles";

export const statsTilesSchema = [
  { key: "heading", label: "Heading", group: "Content", type: "text", default: "This week", maxLength: 60 },
  {
    key: "tiles",
    label: "Tiles",
    description: "Write the change as you would say it. Direction is up, down or flat — anything else is drawn flat.",
    group: "Content",
    type: "list",
    default: [
      { label: "Signed up", value: "128", change: "12 more than last week", direction: "up" },
      { label: "Invoices sent", value: "64", change: "3 fewer than last week", direction: "down" },
      { label: "Open tickets", value: "9", change: "the same as last week", direction: "flat" },
      { label: "Average reply", value: "2h 14m", change: "21 minutes quicker", direction: "up" },
    ],
    fields: [
      { key: "label", label: "Label", maxLength: 40 },
      { key: "value", label: "Value", maxLength: 20 },
      { key: "change", label: "Change, in words", maxLength: 60 },
      { key: "direction", label: "up / down / flat", maxLength: 6 },
    ],
    maxItems: 12,
    itemLabel: "Tile",
  },
  { key: "showChange", label: "Show the change line", group: "Add-ons", type: "boolean", default: true },
  { key: "columns", label: "Columns on a wide screen", group: "Style", type: "select", default: "four", options: ["two", "three", "four"] },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", description: "The change arrow.", group: "Style", type: "color", default: "#0f766e" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof statsTilesSchema>, StatsTilesConfig> = true;
