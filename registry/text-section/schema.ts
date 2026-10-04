import type { ConfigOf, Schema } from "@/lib/schema";
import type { TextSectionConfig } from "./react/text-section";

export const textSectionSchema = [
  { key: "eyebrow", label: "Line above the heading", description: "Not a heading, so it cannot break the page outline. Leave it empty for none.", group: "Content", type: "text", default: "Why we built it", maxLength: 60 },
  { key: "heading", label: "Heading", group: "Content", type: "text", default: "Every project in one place", maxLength: 120 },
  { key: "headingLevel", label: "Heading level", description: "H2 under the page's H1; H3 inside another section.", group: "Content", type: "select", default: "h2", options: ["h2", "h3"] },
  {
    key: "body",
    label: "Text",
    description: "Leave a blank line between paragraphs.",
    group: "Content",
    type: "text",
    default:
      "Small teams lose hours asking where things are. The latest file is in someone's inbox, the decision was in a meeting, and the task list lives in a spreadsheet nobody opens.\n\nNorthwind keeps the work, the files and the decisions together, so the answer is always one click away.",
    maxLength: 2000,
  },
  { key: "linkText", label: "Link text", description: "Leave it empty for no link. Say where it goes, not \"click here\".", group: "Content", type: "text", default: "Read how it works", maxLength: 60 },
  { key: "linkHref", label: "Link goes to", group: "Content", type: "text", format: "url", default: "/how-it-works", maxLength: 300 },
  { key: "align", label: "Alignment", description: "Long text reads best aligned to the left.", group: "Style", type: "select", default: "left", options: ["left", "centre"] },
  { key: "theme", label: "Theme", group: "Style", type: "select", default: "light", options: ["light", "dark", "system"] },
  { key: "accentColor", label: "Accent colour", description: "The line above the heading and the link, darkened if needed to stay readable.", group: "Style", type: "color", default: "#2563eb" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof textSectionSchema>, TextSectionConfig> = true;
