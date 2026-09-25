import type { ConfigOf, Schema } from "@/lib/schema";
import type { KanbanConfig } from "./react/kanban";

export const kanbanSchema = [
  { key: "label", label: "Board name", description: "Read out when a screen reader reaches the board.", group: "Content", type: "text", default: "Refit board", maxLength: 60 },
  {
    key: "columns",
    label: "Columns",
    group: "Content",
    type: "list",
    default: [{ name: "To do" }, { name: "In progress" }, { name: "Done" }],
    fields: [{ key: "name", label: "Name", maxLength: 30 }],
    maxItems: 6,
    itemLabel: "Column",
  },
  {
    key: "cards",
    label: "Cards",
    description: "The column has to match one of the column names; anything else starts in the first column.",
    group: "Content",
    type: "list",
    default: [
      { title: "Order sailcloth", column: "To do" },
      { title: "Sand the deck", column: "To do" },
      { title: "Rewire the cabin", column: "In progress" },
      { title: "Replace the winch", column: "In progress" },
      { title: "Paint the hull", column: "Done" },
    ],
    fields: [
      { key: "title", label: "Title", maxLength: 60 },
      { key: "column", label: "Column", maxLength: 30 },
    ],
    maxItems: 24,
    itemLabel: "Card",
  },
  { key: "showCounts", label: "Card counts", group: "Add-ons", type: "boolean", default: true },
  {
    key: "allowDrag",
    label: "Dragging",
    description: "The buttons on each card work either way — dragging is the extra, never the only way.",
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
  { key: "accentColor", label: "Accent colour", description: "Focus rings.", group: "Style", type: "color", default: "#7c3aed" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof kanbanSchema>, KanbanConfig> = true;
