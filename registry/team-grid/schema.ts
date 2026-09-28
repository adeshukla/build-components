import type { ConfigOf, Schema } from "@/lib/schema";
import type { TeamGridConfig } from "./react/team-grid";

export const teamGridSchema = [
  { key: "heading", label: "Heading", group: "Content", type: "text", default: "Who you will be working with", maxLength: 80 },
  { key: "intro", label: "Intro", description: "Leave it empty for none.", group: "Content", type: "text", default: "Four of us, one time zone, no account managers.", maxLength: 200 },
  {
    key: "people",
    label: "People",
    description: "No names ship with this part. Put your own in, and ask each person first.",
    group: "Content",
    type: "list",
    default: [
      { name: "[TODO: name]", role: "Engineering lead", href: "" },
      { name: "[TODO: name]", role: "Designer", href: "" },
      { name: "[TODO: name]", role: "Accessibility specialist", href: "" },
      { name: "[TODO: name]", role: "Support", href: "" },
    ],
    fields: [
      { key: "name", label: "Name", maxLength: 80 },
      { key: "role", label: "Role", maxLength: 80 },
      { key: "href", label: "Links to", maxLength: 300, format: "url" },
    ],
    maxItems: 30,
    itemLabel: "Person",
  },
  { key: "columns", label: "Columns", group: "Style", type: "number", default: 2, min: 1, max: 5 },
  { key: "showInitials", label: "Initials circle", group: "Add-ons", type: "boolean", default: true },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or follow the device.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#0f766e" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof teamGridSchema>, TeamGridConfig> = true;
