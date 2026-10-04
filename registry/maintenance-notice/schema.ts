import type { ConfigOf, Schema } from "@/lib/schema";
import type { MaintenanceNoticeConfig } from "./react/maintenance-notice";

export const maintenanceNoticeSchema = [
  { key: "heading", label: "Heading", group: "Content", type: "text", default: "Planned maintenance", maxLength: 80 },
  { key: "message", label: "What it affects", description: "Say what will and will not work. \"Scheduled maintenance\" on its own tells nobody anything.", group: "Content", type: "text", default: "Saving will be turned off while we move the database. Anything already saved stays safe.", maxLength: 240 },
  { key: "startsAt", label: "Starts", description: "As 2026-10-04T22:00.", group: "Content", type: "text", default: "2026-10-04T22:00", maxLength: 16 },
  { key: "endsAt", label: "Ends", description: "As 2026-10-05T02:00.", group: "Content", type: "text", default: "2026-10-05T02:00", maxLength: 16 },
  { key: "tone", label: "Tone", group: "Style", type: "select", default: "planned", options: ["planned", "warning"] },
  { key: "linkLabel", label: "Link text", description: "Leave it empty for no link.", group: "Content", type: "text", default: "What this affects", maxLength: 60 },
  { key: "linkHref", label: "Link goes to", description: "http or https only.", group: "Content", type: "text", format: "url", default: "https://build-components.devstash.me/accessibility", maxLength: 300 },
  { key: "dismissible", label: "Can be dismissed", group: "Behaviour", type: "boolean", default: true },
  { key: "dismissLabel", label: "Dismiss button name", description: "It shows ×; this is what it is called.", group: "Content", type: "text", default: "Dismiss this notice", maxLength: 60 },
  { key: "remember", label: "Remember the dismissal", group: "Behaviour", type: "boolean", default: true },
  { key: "storageKey", label: "Storage key", description: "Change it for a new notice, or the old dismissal hides the new one.", group: "Behaviour", type: "text", default: "maintenance-2026-10-04", maxLength: 60 },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or follow the device.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#e6b24a" },
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
    key: "momentText",
    label: "Moment",
    description: "A start or end. {day}, {month} and {time} are filled in.",
    group: "Words",
    type: "text",
    default: "{day} {month} at {time}",
    maxLength: 60,
  },
  {
    key: "windowText",
    label: "Window",
    description: "The whole window. {start} and {end} are filled in.",
    group: "Words",
    type: "text",
    default: "{start} until {end}",
    maxLength: 80,
  },
  {
    key: "dismissedText",
    label: "Dismissed",
    description: "Said after closing it.",
    group: "Words",
    type: "text",
    default: "Notice dismissed.",
    maxLength: 80,
  },
  {
    key: "dismissedForeverText",
    label: "Dismissed for good",
    description: "Said after closing it when it is remembered.",
    group: "Words",
    type: "text",
    default: "Notice dismissed. It will not come back on this browser.",
    maxLength: 120,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof maintenanceNoticeSchema>, MaintenanceNoticeConfig> = true;
