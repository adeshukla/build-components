import type { ConfigOf, Schema } from "@/lib/schema";
import type { ProductCardConfig } from "./react/product-card";

export const productCardSchema = [
  { key: "name", label: "Product name", group: "Content", type: "text", default: "Deck jacket", maxLength: 60 },
  { key: "price", label: "Price", description: "Written exactly as you type it — no currency maths here.", group: "Content", type: "text", default: "£128", maxLength: 20 },
  { key: "headingLevel", label: "Heading level", description: "h1 when the card is the product's own page.", group: "Content", type: "select", default: "h2", options: ["h1", "h2", "h3"] },
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
  {
    key: "outText",
    label: "Out of stock",
    description: "Said after a choice that has run out.",
    group: "Words",
    type: "text",
    default: "(out of stock)",
    maxLength: 40,
  },
  {
    key: "pickText",
    label: "Choose first",
    description: "Said until every choice is made. {missing} is what is left.",
    group: "Words",
    type: "text",
    default: "Pick a {missing} first",
    maxLength: 80,
  },
  {
    key: "andText",
    label: "Joining word",
    description: "Joins what is left in the message above, as and a.",
    group: "Words",
    type: "text",
    default: "and a",
    maxLength: 20,
  },
  {
    key: "addedText",
    label: "Added",
    description: "Said after adding. {name} and {choices} are filled in.",
    group: "Words",
    type: "text",
    default: "{name} added: {choices}",
    maxLength: 120,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof productCardSchema>, ProductCardConfig> = true;
