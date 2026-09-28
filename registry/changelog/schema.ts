import type { ConfigOf, Schema } from "@/lib/schema";
import type { ChangelogConfig } from "./react/changelog";

export const changelogSchema = [
  { key: "heading", label: "Heading", group: "Content", type: "text", default: "What changed", maxLength: 80 },
  { key: "headingLevel", label: "Heading level", description: "Each release gets the next level down.", group: "Content", type: "select", default: "h2", options: ["h2", "h3"] },
  {
    key: "entries",
    label: "Entries",
    description: "Entries with the same version in a row become one release, grouped by kind. Newest first.",
    group: "Content",
    type: "list",
    default: [
      { version: "2.4.0", date: "2026-09-18", kind: "Added", text: "Keyboard shortcuts for every board action." },
      { version: "2.4.0", date: "2026-09-18", kind: "Added", text: "Export a board as CSV." },
      { version: "2.4.0", date: "2026-09-18", kind: "Fixed", text: "Dragging a card in Safari dropped it one place short." },
      { version: "2.3.1", date: "2026-08-30", kind: "Fixed", text: "The invite email linked to the old sign-in page." },
      { version: "2.3.0", date: "2026-08-12", kind: "Changed", text: "Comments now load oldest first." },
      { version: "2.3.0", date: "2026-08-12", kind: "Removed", text: "The legacy CSV importer, replaced in 2.1." },
    ],
    fields: [
      { key: "version", label: "Version", maxLength: 20 },
      { key: "date", label: "Date", maxLength: 10 },
      { key: "kind", label: "Kind", maxLength: 20 },
      { key: "text", label: "What changed", maxLength: 200 },
    ],
    maxItems: 60,
    itemLabel: "Entry",
  },
  { key: "showLatest", label: "Mark the newest release", group: "Add-ons", type: "boolean", default: true },
  { key: "latestLabel", label: "Newest label", group: "Content", type: "text", default: "Latest", maxLength: 20 },
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
export const schemaMatchesComponent: Same<ConfigOf<typeof changelogSchema>, ChangelogConfig> = true;
