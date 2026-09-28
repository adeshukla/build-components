import type { ConfigOf, Schema } from "@/lib/schema";
import type { InvoiceSummaryConfig } from "./react/invoice-summary";

export const invoiceSummarySchema = [
  { key: "caption", label: "Caption", group: "Content", type: "text", default: "Invoice 1042 — September", maxLength: 80 },
  { key: "currency", label: "Currency symbol", group: "Style", type: "text", default: "£", maxLength: 4 },
  {
    key: "items",
    label: "Lines",
    description: "The amount per line and every total are worked out from these, never typed in.",
    group: "Content",
    type: "list",
    default: [
      { description: "Design review, 4 hours", quantity: "4", unitPrice: "95" },
      { description: "Accessibility audit", quantity: "1", unitPrice: "1200" },
      { description: "Follow-up session", quantity: "2", unitPrice: "95" },
    ],
    fields: [
      { key: "description", label: "Item", maxLength: 100 },
      { key: "quantity", label: "Qty", maxLength: 8 },
      { key: "unitPrice", label: "Unit price", maxLength: 12 },
    ],
    maxItems: 30,
    itemLabel: "Line",
  },
  { key: "descriptionHeader", label: "Item column", group: "Content", type: "text", default: "Item", maxLength: 30 },
  { key: "quantityHeader", label: "Quantity column", group: "Content", type: "text", default: "Qty", maxLength: 30 },
  { key: "unitHeader", label: "Unit column", group: "Content", type: "text", default: "Unit", maxLength: 30 },
  { key: "amountHeader", label: "Amount column", group: "Content", type: "text", default: "Amount", maxLength: 30 },
  { key: "subtotalLabel", label: "Subtotal label", group: "Content", type: "text", default: "Subtotal", maxLength: 40 },
  { key: "taxLabel", label: "Tax label", description: "The rate is added to it, so the number is never unexplained.", group: "Content", type: "text", default: "VAT", maxLength: 30 },
  { key: "taxPercent", label: "Tax rate (%)", group: "Behaviour", type: "number", default: 20, min: 0, max: 100 },
  { key: "totalLabel", label: "Total label", group: "Content", type: "text", default: "Total due", maxLength: 40 },
  { key: "note", label: "Note under the table", description: "Leave it empty for none.", group: "Content", type: "text", default: "Payable within 30 days. Bank details are on the last page.", maxLength: 200 },
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
export const schemaMatchesComponent: Same<ConfigOf<typeof invoiceSummarySchema>, InvoiceSummaryConfig> = true;
