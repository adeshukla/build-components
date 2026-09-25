import type { ConfigOf, Schema } from "@/lib/schema";
import type { PricingTableConfig } from "./react/pricing-table";

export const pricingTableSchema = [
  { key: "heading", label: "Heading", group: "Content", type: "text", default: "Plans", maxLength: 60 },
  {
    key: "plans",
    label: "Plans",
    description: "Prices are shown exactly as you write them — nothing is worked out for you. Separate features with semicolons.",
    group: "Content",
    type: "list",
    default: [
      { name: "Solo", monthly: "9", yearly: "90", blurb: "For one person and one project.", features: "1 project; 5 GB of files; Email support" },
      {
        name: "Crew",
        monthly: "29",
        yearly: "290",
        blurb: "For a small team that ships together.",
        features: "10 projects; 100 GB of files; Shared boards; Email support",
      },
      {
        name: "Fleet",
        monthly: "79",
        yearly: "790",
        blurb: "For several teams under one roof.",
        features: "Unlimited projects; 1 TB of files; Shared boards; Single sign-on; Priority support",
      },
    ],
    fields: [
      { key: "name", label: "Name", maxLength: 30 },
      { key: "monthly", label: "Monthly price", maxLength: 12 },
      { key: "yearly", label: "Yearly price", maxLength: 12 },
      { key: "blurb", label: "One line about it", maxLength: 80 },
      { key: "features", label: "Features (semicolons)", maxLength: 240 },
    ],
    maxItems: 6,
    itemLabel: "Plan",
  },
  { key: "featured", label: "Highlighted plan", description: "Matched by name. It gets a badge as well as the colour.", group: "Style", type: "text", default: "Crew", maxLength: 30 },
  { key: "currency", label: "Currency symbol", group: "Content", type: "text", default: "£", maxLength: 3 },
  { key: "showCycle", label: "Monthly / yearly switch", group: "Add-ons", type: "boolean", default: true },
  { key: "monthlyLabel", label: "Monthly label", group: "Content", type: "text", default: "Monthly", maxLength: 20 },
  { key: "yearlyLabel", label: "Yearly label", group: "Content", type: "text", default: "Yearly", maxLength: 20 },
  {
    key: "yearlyNote",
    label: "Yearly note",
    description: "Shown only while yearly is picked. Say the real saving, not a made-up percentage.",
    group: "Content",
    type: "text",
    default: "Two months off when you pay for a year.",
    maxLength: 120,
  },
  { key: "chooseText", label: "Button verb", description: "The plan name is added after it.", group: "Content", type: "text", default: "Choose", maxLength: 20 },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#0f766e" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof pricingTableSchema>, PricingTableConfig> = true;
