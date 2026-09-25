import type { ConfigOf, Schema } from "@/lib/schema";
import type { DataGridConfig } from "./react/data-grid";

export const dataGridSchema = [
  { key: "caption", label: "Caption", description: "What the table is of. Screen readers read it first.", group: "Content", type: "text", default: "Documents", maxLength: 60 },
  {
    key: "rows",
    label: "Rows",
    group: "Content",
    type: "list",
    default: [
      { name: "Anchor plan", owner: "Priya", status: "In review", updated: "4 Mar 2026" },
      { name: "Ballast notes", owner: "Sam", status: "Draft", updated: "2 Mar 2026" },
      { name: "Cargo manifest", owner: "Ade", status: "Signed off", updated: "28 Feb 2026" },
      { name: "Deck survey", owner: "Marta", status: "In review", updated: "26 Feb 2026" },
      { name: "Engine log", owner: "Sam", status: "Draft", updated: "21 Feb 2026" },
      { name: "Fuel report", owner: "Priya", status: "Signed off", updated: "19 Feb 2026" },
      { name: "Galley order", owner: "Ade", status: "Draft", updated: "14 Feb 2026" },
      { name: "Hull check", owner: "Marta", status: "Signed off", updated: "11 Feb 2026" },
    ],
    fields: [
      { key: "name", label: "Name", maxLength: 60 },
      { key: "owner", label: "Owner", maxLength: 40 },
      { key: "status", label: "Status", maxLength: 40 },
      { key: "updated", label: "Updated", maxLength: 40 },
    ],
    maxItems: 40,
    itemLabel: "Row",
  },
  {
    key: "stickyHeader",
    label: "Header stays put",
    description: "The header row stays visible while the rows scroll under it.",
    group: "Behaviour",
    type: "boolean",
    default: true,
  },
  { key: "sortable", label: "Sortable columns", description: "Each header becomes a button and reports aria-sort.", group: "Behaviour", type: "boolean", default: true },
  {
    key: "resizable",
    label: "Resizable columns",
    description: "Drag the edge, or focus it and use the arrow keys.",
    group: "Behaviour",
    type: "boolean",
    default: true,
  },
  { key: "maxHeight", label: "Height before scrolling (px)", description: "0 means no limit.", group: "Style", type: "number", default: 320, min: 0, max: 800 },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", description: "Focus rings.", group: "Style", type: "color", default: "#1d4ed8" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof dataGridSchema>, DataGridConfig> = true;
