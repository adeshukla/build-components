import type { ConfigOf, Schema } from "@/lib/schema";
import type { HowItWorksConfig } from "./react/how-it-works";

export const howItWorksSchema = [
  { key: "heading", label: "Heading", group: "Content", type: "text", default: "How a refit works", maxLength: 80 },
  { key: "intro", label: "Intro", description: "Leave it empty for none.", group: "Content", type: "text", default: "Four steps, and you hear from us at each one.", maxLength: 200 },
  {
    key: "steps",
    label: "Steps",
    description: "The meta line is for how long it takes, or who does it.",
    group: "Content",
    type: "list",
    default: [
      { title: "Tell us what it needs", text: "A short form, or a phone call if that is easier. Photographs help.", meta: "10 minutes" },
      { title: "We look it over", text: "One of our engineers goes through it and asks anything that is unclear.", meta: "Two working days" },
      { title: "You get a written quote", text: "Itemised, with the parts we would use and what each stage costs.", meta: "By email" },
      { title: "Work starts when you say", text: "We book the berth and keep you posted every week until it is done.", meta: "Your call" },
    ],
    fields: [
      { key: "title", label: "Title", maxLength: 60 },
      { key: "text", label: "Text", maxLength: 240 },
      { key: "meta", label: "Meta", maxLength: 40 },
    ],
    maxItems: 8,
    itemLabel: "Step",
  },
  { key: "layout", label: "Layout", description: "Across the page, or down it.", group: "Style", type: "select", default: "across", options: ["across", "down"] },
  { key: "showNumbers", label: "Numbered circles", group: "Style", type: "boolean", default: true },
  { key: "showConnector", label: "Line between steps", group: "Style", type: "boolean", default: true },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or follow the device.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", description: "The numbers.", group: "Style", type: "color", default: "#16303f" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof howItWorksSchema>, HowItWorksConfig> = true;
