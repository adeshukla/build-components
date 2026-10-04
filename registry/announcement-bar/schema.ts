import type { ConfigOf, Schema } from "@/lib/schema";
import type { AnnouncementBarConfig } from "./react/announcement-bar";

export const announcementBarSchema = [
  { key: "message", label: "Message", description: "One short line.", group: "Content", type: "text", default: "Shared boards are here: plan a week together.", maxLength: 140 },
  { key: "linkText", label: "Link text", description: "Leave it empty for no link.", group: "Content", type: "text", default: "See what is new", maxLength: 40 },
  { key: "linkHref", label: "Link goes to", group: "Content", type: "text", format: "url", default: "/changelog", maxLength: 300 },
  { key: "tone", label: "Look", description: "Your accent colour, near-black, or a quiet grey band.", group: "Style", type: "select", default: "accent", options: ["accent", "dark", "subtle"] },
  { key: "theme", label: "Theme", description: "For the quiet look: light, dark, or the visitor's.", group: "Style", type: "select", default: "light", options: ["light", "dark", "system"] },
  { key: "accentColor", label: "Accent colour", description: "Text on it is black or white, whichever reads.", group: "Style", type: "color", default: "#2563eb" },
  {
    key: "regionLabel",
    label: "Announcement area",
    description: "Names the bar, for screen readers.",
    group: "Words",
    type: "text",
    default: "Announcement",
    maxLength: 60,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof announcementBarSchema>, AnnouncementBarConfig> = true;
