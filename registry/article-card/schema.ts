import type { ConfigOf, Schema } from "@/lib/schema";
import type { ArticleCardConfig } from "./react/article-card";

export const articleCardSchema = [
  { key: "title", label: "Title", description: "The card's only link. There is deliberately no second \"Read more\".", group: "Content", type: "text", default: "Why your focus ring keeps disappearing", maxLength: 140 },
  { key: "href", label: "Link goes to", description: "http or https only.", group: "Content", type: "text", format: "url", default: "https://build-components.devstash.me/accessibility", maxLength: 300 },
  { key: "summary", label: "Summary", group: "Content", type: "text", default: "Four ways a focus ring gets lost — overflow, outline:none, a sticky header and a transform — and what to do about each.", maxLength: 300 },
  { key: "date", label: "Date", description: "As 2026-09-12.", group: "Content", type: "text", default: "2026-09-12", maxLength: 10 },
  { key: "readingMinutes", label: "Minutes to read", description: "Nought hides it.", group: "Content", type: "number", default: 7, min: 0, max: 180 },
  { key: "tags", label: "Tags", description: "Separated by commas. They are a list, not links.", group: "Content", type: "text", default: "Accessibility, CSS", maxLength: 160 },
  { key: "headingLevel", label: "Heading level", description: "A grid of cards usually sits under an h2, so these are h3.", group: "Content", type: "select", default: "h2", options: ["h2", "h3"] },
  { key: "wholeCardClickable", label: "Whole card clickable", description: "Adds an overlay over the card. It costs text selection inside it.", group: "Behaviour", type: "boolean", default: true },
  { key: "showThumb", label: "Thumbnail slot", group: "Add-ons", type: "boolean", default: true },
  { key: "thumbAlt", label: "Thumbnail description", description: "Leave it empty when the picture is decoration. Filling it makes the slot an image with a name.", group: "Content", type: "text", default: "", maxLength: 200 },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or follow the device.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#7c3aed" },
  {
    key: "monthNames",
    label: "Month names",
    description: "The twelve months, January first, with commas between.",
    group: "Words",
    type: "text",
    default: "January,February,March,April,May,June,July,August,September,October,November,December",
    maxLength: 240,
  },
  {
    key: "dateText",
    label: "Date",
    description: "How a date is written. {day}, {month} and {year} are filled in.",
    group: "Words",
    type: "text",
    default: "{day} {month} {year}",
    maxLength: 40,
  },
  {
    key: "readText",
    label: "Reading time",
    description: "{minutes} is the number of minutes.",
    group: "Words",
    type: "text",
    default: "{minutes} minute read",
    maxLength: 40,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof articleCardSchema>, ArticleCardConfig> = true;
