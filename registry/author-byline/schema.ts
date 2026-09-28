import type { ConfigOf, Schema } from "@/lib/schema";
import type { AuthorBylineConfig } from "./react/author-byline";

export const authorBylineSchema = [
  { key: "name", label: "Name", group: "Content", type: "text", default: "Adesh Shukla", maxLength: 80 },
  { key: "nameHref", label: "Name links to", description: "http or https only. Leave it empty for no link.", group: "Content", type: "text", format: "url", default: "https://devstash.me", maxLength: 300 },
  { key: "role", label: "Role", description: "Leave it empty for none.", group: "Content", type: "text", default: "UI developer", maxLength: 80 },
  { key: "date", label: "Published", description: "As 2026-09-12.", group: "Content", type: "text", default: "2026-09-12", maxLength: 10 },
  { key: "updatedDate", label: "Updated", description: "Shown as well as the published date, not instead of it. Empty for none.", group: "Content", type: "text", default: "2026-09-24", maxLength: 10 },
  { key: "readingMinutes", label: "Minutes to read", description: "Nought hides it.", group: "Content", type: "number", default: 7, min: 0, max: 180 },
  { key: "showAvatar", label: "Initials circle", group: "Add-ons", type: "boolean", default: true },
  { key: "initials", label: "Initials", description: "Leave it empty to take them from the name.", group: "Content", type: "text", default: "", maxLength: 3 },
  { key: "layout", label: "Layout", group: "Style", type: "select", default: "row", options: ["row", "stacked"] },
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
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof authorBylineSchema>, AuthorBylineConfig> = true;
