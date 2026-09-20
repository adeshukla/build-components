import type { ConfigOf, Schema } from "@/lib/schema";
import type { TableConfig } from "./react/table";

export const tableSchema = [
  {
    key: "caption",
    label: "Caption",
    description: "What the table shows. Screen readers read it before the rows, so it is never decoration.",
    group: "Content",
    type: "text",
    default: "Orders this week",
    maxLength: 100,
  },
  {
    key: "data",
    label: "Rows",
    description:
      "Comma-separated lines: the first line names the columns. Paste from a spreadsheet. A cell cannot contain a comma.",
    group: "Content",
    type: "text",
    default:
      "Order,Customer,Placed,Items,Total\nAB-1042,Harbour Studio,12 Mar,3,£186.00\nAB-1043,Northwind,12 Mar,1,£24.50\nAB-1044,Pilot Labs,13 Mar,7,£412.75\nAB-1045,Meridian,14 Mar,2,£68.00",
    maxLength: 3000,
  },
  {
    key: "emptyText",
    label: "Empty text",
    description: "Shown instead of the table when there are no rows.",
    group: "Content",
    type: "text",
    default: "No orders yet.",
    maxLength: 140,
  },
  {
    key: "sortable",
    label: "Sortable columns",
    description: "Each column heading becomes a button, and the column says which way it is sorted.",
    group: "Behaviour",
    type: "boolean",
    default: true,
  },
  {
    key: "selectable",
    label: "Row selection",
    description: "A checkbox per row, named by its first cell, with a count that is announced as it changes.",
    group: "Behaviour",
    type: "boolean",
    default: true,
  },
  {
    key: "small",
    label: "On a phone",
    description: "Stack each row into a card with its column names, or keep the table and scroll it sideways.",
    group: "Behaviour",
    type: "select",
    default: "stack",
    options: ["stack", "scroll"],
  },
  {
    key: "stickyHeader",
    label: "Sticky heading row",
    description: "The heading row stays while the rows scroll under it.",
    group: "Add-ons",
    type: "boolean",
    default: false,
  },
  {
    key: "zebra",
    label: "Striped rows",
    description: "Every other row is shaded, which helps the eye track across wide tables.",
    group: "Add-ons",
    type: "boolean",
    default: true,
  },
  {
    key: "density",
    label: "Density",
    description: "How much room each row takes.",
    group: "Style",
    type: "select",
    default: "comfortable",
    options: ["comfortable", "compact"],
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
    description: "Checkboxes and focus rings. Contrast-corrected before it is used as text.",
    group: "Style",
    type: "color",
    default: "#2563eb",
  },
  {
    key: "radius",
    label: "Corner radius (px)",
    description: "Roundness of the frame around the table.",
    group: "Style",
    type: "number",
    default: 10,
    min: 0,
    max: 24,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof tableSchema>, TableConfig> = true;
