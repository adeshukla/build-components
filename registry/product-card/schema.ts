import type { ConfigOf, Schema } from "@/lib/schema";
import type { ProductCardConfig } from "./react/product-card";

export const productCardSchema = [
  { key: "name", label: "Product name", group: "Content", type: "text", default: "Deck jacket", maxLength: 60 },
  { key: "price", label: "Price", description: "Written exactly as you type it — no currency maths here.", group: "Content", type: "text", default: "£128", maxLength: 20 },
  { key: "blurb", label: "One line about it", group: "Content", type: "text", default: "Waxed cotton, taped seams, two chest pockets.", maxLength: 120 },
  {
    key: "options",
    label: "Options",
    description: "Options sharing a group are one choice. Stock is in or out; out cannot be picked.",
    group: "Content",
    type: "list",
    default: [
      { group: "Colour", label: "Navy", stock: "in" },
      { group: "Colour", label: "Sand", stock: "in" },
      { group: "Colour", label: "Moss", stock: "out" },
      { group: "Size", label: "S", stock: "in" },
      { group: "Size", label: "M", stock: "in" },
      { group: "Size", label: "L", stock: "in" },
      { group: "Size", label: "XL", stock: "out" },
    ],
    fields: [
      { key: "group", label: "Group", maxLength: 30 },
      { key: "label", label: "Option", maxLength: 30 },
      { key: "stock", label: "in / out", maxLength: 3 },
    ],
    maxItems: 24,
    itemLabel: "Option",
  },
  { key: "addText", label: "Add button", group: "Content", type: "text", default: "Add to bag", maxLength: 30 },
  { key: "showPrice", label: "Show the price", group: "Add-ons", type: "boolean", default: true },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#16303f" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof productCardSchema>, ProductCardConfig> = true;
