import type { ConfigOf, Schema } from "@/lib/schema";
import type { CardFieldsConfig } from "./react/card-fields";

export const cardFieldsSchema = [
  { key: "title", label: "Title", group: "Content", type: "text", default: "Payment details", maxLength: 60 },
  {
    key: "amount",
    label: "Amount",
    description: "Shown on the button, as you write it (e.g. £49.00). Not calculated.",
    group: "Content",
    type: "text",
    default: "£49.00",
    maxLength: 20,
  },
  { key: "buttonText", label: "Button text", group: "Content", type: "text", default: "Pay", maxLength: 30 },
  { key: "showName", label: "Name on card", group: "Add-ons", type: "boolean", default: true },
  { key: "showPostcode", label: "Postcode", description: "Some providers use it to check the card.", group: "Add-ons", type: "boolean", default: true },
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
    description: "The pay button and the focus ring.",
    group: "Style",
    type: "color",
    default: "#2563eb",
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof cardFieldsSchema>, CardFieldsConfig> = true;
