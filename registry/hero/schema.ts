import type { ConfigOf, Schema } from "@/lib/schema";
import type { HeroConfig } from "./react/hero";

export const heroSchema = [
  { key: "eyebrow", label: "Line above the heading", description: "Not a heading, so it cannot break the page outline. Leave it empty for none.", group: "Content", type: "text", default: "Refit yard, Falmouth", maxLength: 60 },
  { key: "heading", label: "Heading", group: "Content", type: "text", default: "Get your boat ready before the season starts", maxLength: 120 },
  {
    key: "headingLevel",
    label: "Heading level",
    description: "h1 when this is the top of the page, h2 when the page already has one.",
    group: "Behaviour",
    type: "select",
    default: "h1",
    options: ["h1", "h2"],
  },
  {
    key: "copy",
    label: "Paragraph",
    group: "Content",
    type: "text",
    default: "Rigging, engines, hulls and electronics under one roof. Tell us what it needs and we will send a written quote within two working days.",
    maxLength: 300,
  },
  { key: "primaryText", label: "Main button", description: "Leave it empty to drop the button.", group: "Content", type: "text", default: "Ask for a quote", maxLength: 40 },
  { key: "primaryHref", label: "Main button link", group: "Content", type: "text", default: "/quote", maxLength: 200, format: "url" },
  { key: "secondaryText", label: "Second button", group: "Content", type: "text", default: "See the yard", maxLength: 40 },
  { key: "secondaryHref", label: "Second button link", group: "Content", type: "text", default: "/yard", maxLength: 200, format: "url" },
  { key: "note", label: "Note under the buttons", group: "Content", type: "text", default: "No deposit until the work is agreed.", maxLength: 120 },
  { key: "align", label: "Alignment", group: "Style", type: "select", default: "left", options: ["left", "centre"] },
  { key: "showPanel", label: "Picture panel", description: "A drawn placeholder beside the text. Swap it for your own image.", group: "Add-ons", type: "boolean", default: true },
  { key: "panelLabel", label: "Picture description", description: "What the picture shows, for anyone who cannot see it.", group: "Content", type: "text", default: "Photograph of the yard goes here", maxLength: 120 },
  { key: "imageSrc", label: "Picture", description: "Empty draws a placeholder instead. No image ships with this part.", group: "Content", type: "text", format: "url", default: "", maxLength: 300 },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or follow the device.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", description: "The main button.", group: "Style", type: "color", default: "#16303f" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof heroSchema>, HeroConfig> = true;
