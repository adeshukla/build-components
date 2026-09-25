import type { ConfigOf, Schema } from "@/lib/schema";
import type { CountdownConfig } from "./react/countdown";

export const countdownSchema = [
  { key: "label", label: "Label", group: "Content", type: "text", default: "Doors open in", maxLength: 60 },
  {
    key: "target",
    label: "Counts down to",
    description: "The moment it ends, as 2026-12-24T18:00. Read in the visitor's own time zone.",
    group: "Content",
    type: "text",
    default: "2026-12-24T18:00",
    maxLength: 30,
  },
  { key: "finishedText", label: "When it ends", group: "Content", type: "text", default: "Doors are open.", maxLength: 80 },
  { key: "showSeconds", label: "Show seconds", group: "Style", type: "boolean", default: true },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#b45309" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof countdownSchema>, CountdownConfig> = true;
