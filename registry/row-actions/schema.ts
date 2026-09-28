import type { ConfigOf, Schema } from "@/lib/schema";
import type { RowActionsConfig } from "./react/row-actions";

export const rowActionsSchema = [
  { key: "caption", label: "Table caption", group: "Content", type: "text", default: "Saved reports", maxLength: 80 },
  { key: "nameHeader", label: "Name column", group: "Content", type: "text", default: "Report", maxLength: 40 },
  { key: "metaHeader", label: "Second column", group: "Content", type: "text", default: "Last run", maxLength: 40 },
  { key: "actionsHeader", label: "Actions column", description: "An empty header cell leaves the column unexplained.", group: "Content", type: "text", default: "Actions", maxLength: 40 },
  {
    key: "records",
    label: "Rows",
    group: "Content",
    type: "list",
    default: [
      { name: "Quarterly revenue", meta: "18 September 2026" },
      { name: "Churn by cohort", meta: "12 September 2026" },
      { name: "Support backlog", meta: "2 September 2026" },
    ],
    fields: [
      { key: "name", label: "Name", maxLength: 80 },
      { key: "meta", label: "Second column", maxLength: 60 },
    ],
    maxItems: 30,
    itemLabel: "Row",
  },
  {
    key: "actions",
    label: "Actions",
    description: "Kind is normal or danger. Each button is named with the row it belongs to.",
    group: "Content",
    type: "list",
    default: [
      { label: "Run", kind: "normal" },
      { label: "Duplicate", kind: "normal" },
      { label: "Delete", kind: "danger" },
    ],
    fields: [
      { key: "label", label: "Label", maxLength: 30 },
      { key: "kind", label: "Kind", maxLength: 10 },
    ],
    maxItems: 6,
    itemLabel: "Action",
  },
  { key: "doneTemplate", label: "What it says afterwards", description: "{action} and {record} are filled in.", group: "Content", type: "text", default: "{action} — {record}", maxLength: 80 },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or follow the device.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#1d4ed8" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof rowActionsSchema>, RowActionsConfig> = true;
