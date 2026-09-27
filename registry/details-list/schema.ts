import type { ConfigOf, Schema } from "@/lib/schema";
import type { DetailsListConfig } from "./react/details-list";

export const detailsListSchema = [
  { key: "heading", label: "Heading", description: "Leave it empty for none.", group: "Content", type: "text", default: "Order details", maxLength: 60 },
  {
    key: "rows",
    label: "Rows",
    description: "An empty value shows the not-given wording. A link turns that row into one you can change.",
    group: "Content",
    type: "list",
    default: [
      { term: "Order", detail: "BC-4821", href: "" },
      { term: "Placed", detail: "4 March 2026", href: "" },
      { term: "Delivery address", detail: "12 Harbour Road, Falmouth, TR11 2AB", href: "/account/addresses" },
      { term: "Payment", detail: "Visa ending 4417", href: "/account/payment" },
      { term: "Purchase order", detail: "", href: "" },
    ],
    fields: [
      { key: "term", label: "Label", maxLength: 60 },
      { key: "detail", label: "Value", maxLength: 160 },
      { key: "href", label: "Change link", maxLength: 200, format: "url" },
    ],
    maxItems: 30,
    itemLabel: "Row",
  },
  { key: "emptyText", label: "Empty value wording", group: "Content", type: "text", default: "Not given", maxLength: 40 },
  { key: "editText", label: "Link wording", description: "The row label is added after it for screen readers.", group: "Content", type: "text", default: "Change", maxLength: 30 },
  { key: "columns", label: "Columns on a wide screen", group: "Style", type: "select", default: "one", options: ["one", "two"] },
  { key: "dividers", label: "Lines between rows", group: "Style", type: "boolean", default: true },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or follow the device.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", description: "The links.", group: "Style", type: "color", default: "#1d4ed8" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof detailsListSchema>, DetailsListConfig> = true;
