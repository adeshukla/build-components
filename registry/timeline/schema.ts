import type { ConfigOf, Schema } from "@/lib/schema";
import type { TimelineConfig } from "./react/timeline";

export const timelineSchema = [
  { key: "heading", label: "Heading", group: "Content", type: "text", default: "Activity", maxLength: 60 },
  {
    key: "entries",
    label: "Entries",
    description: "Write the time as you want it read. The stamp is the machine-readable one (2026-03-04T09:12).",
    group: "Content",
    type: "list",
    default: [
      { datetime: "2026-03-04T09:12", when: "4 March, 9:12", who: "Priya", what: "moved Anchor plan to In review" },
      { datetime: "2026-03-03T16:40", when: "3 March, 16:40", who: "Sam", what: "left a comment on Ballast notes" },
      { datetime: "2026-03-03T11:02", when: "3 March, 11:02", who: "Ade", what: "signed off the cargo manifest" },
      { datetime: "2026-02-28T14:25", when: "28 February, 14:25", who: "Marta", what: "uploaded the deck survey" },
      { datetime: "2026-02-27T08:05", when: "27 February, 8:05", who: "Priya", what: "invited Sam to the workspace" },
      { datetime: "2026-02-26T17:55", when: "26 February, 17:55", who: "Ade", what: "created the workspace" },
    ],
    fields: [
      { key: "datetime", label: "Stamp", maxLength: 30 },
      { key: "when", label: "Time, as read", maxLength: 40 },
      { key: "who", label: "Who", maxLength: 40 },
      { key: "what", label: "What they did", maxLength: 120 },
    ],
    maxItems: 40,
    itemLabel: "Entry",
  },
  { key: "newestFirst", label: "Newest first", group: "Behaviour", type: "boolean", default: true },
  {
    key: "initialCount",
    label: "Shown at first",
    description: "The rest arrive behind a button, so a long history does not bury the page.",
    group: "Behaviour",
    type: "number",
    default: 3,
    min: 1,
    max: 40,
  },
  { key: "moreText", label: "Reveal button", description: "The number left is added after it.", group: "Content", type: "text", default: "Show older", maxLength: 40 },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", description: "The dots.", group: "Style", type: "color", default: "#7c3aed" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof timelineSchema>, TimelineConfig> = true;
