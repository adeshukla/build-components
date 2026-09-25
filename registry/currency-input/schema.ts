import type { ConfigOf, Schema } from "@/lib/schema";
import type { CurrencyInputConfig } from "./react/currency-input";

export const currencyInputSchema = [
  { key: "label", label: "Label", group: "Content", type: "text", default: "Amount", maxLength: 60 },
  {
    key: "hint",
    label: "Hint",
    group: "Content",
    type: "text",
    default: "Rounded to the nearest penny when you leave the field.",
    maxLength: 160,
  },
  { key: "symbol", label: "Symbol", description: "Shown beside the field, e.g. £ or $.", group: "Content", type: "text", default: "£", maxLength: 6 },
  { key: "symbolAfter", label: "Symbol after the number", group: "Style", type: "boolean", default: false },
  { key: "decimals", label: "Decimal places", group: "Behaviour", type: "number", default: 2, min: 0, max: 4 },
  { key: "allowNegative", label: "Allow negative amounts", description: "For refunds and credits.", group: "Behaviour", type: "boolean", default: false },
  { key: "start", label: "Starting amount", group: "Behaviour", type: "text", default: "1250", maxLength: 20 },
  {
    key: "name",
    label: "Form field name",
    description: "Submits a plain number (no symbol, no commas) for your server.",
    group: "Add-ons",
    type: "text",
    default: "amount",
    maxLength: 40,
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
  { key: "accentColor", label: "Accent colour", description: "The focus ring.", group: "Style", type: "color", default: "#2563eb" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof currencyInputSchema>, CurrencyInputConfig> = true;
