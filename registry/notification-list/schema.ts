import type { ConfigOf, Schema } from "@/lib/schema";
import type { NotificationListConfig } from "./react/notification-list";

export const notificationListSchema = [
  { key: "heading", label: "Heading", description: "The unread count is added to it, inside the text.", group: "Content", type: "text", default: "Notifications", maxLength: 60 },
  {
    key: "items",
    label: "Notifications",
    description: "Unread is yes or no.",
    group: "Content",
    type: "list",
    default: [
      { title: "Priya assigned you “Rewrite the export job”", meta: "12 minutes ago", unread: "yes" },
      { title: "Build 4812 failed on main", meta: "1 hour ago", unread: "yes" },
      { title: "Your weekly summary is ready", meta: "Yesterday", unread: "yes" },
      { title: "Sam commented on “Invoice rounding”", meta: "2 days ago", unread: "no" },
      { title: "Storage is 80% full", meta: "Last week", unread: "no" },
    ],
    fields: [
      { key: "title", label: "What happened", maxLength: 160 },
      { key: "meta", label: "When", maxLength: 40 },
      { key: "unread", label: "Unread", maxLength: 3 },
    ],
    maxItems: 30,
    itemLabel: "Notification",
  },
  { key: "unreadWord", label: "Unread marker", description: "A word, because a coloured dot is not information.", group: "Content", type: "text", default: "Unread", maxLength: 20 },
  { key: "markOneLabel", label: "Per-item button", description: "The item's own words are added to its accessible name.", group: "Content", type: "text", default: "Mark as read", maxLength: 40 },
  { key: "markAllLabel", label: "Mark-all button", group: "Content", type: "text", default: "Mark all as read", maxLength: 40 },
  { key: "allReadText", label: "When nothing is unread", group: "Content", type: "text", default: "Nothing unread.", maxLength: 80 },
  { key: "showCount", label: "Count in the heading", group: "Add-ons", type: "boolean", default: true },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or follow the device.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#1d4ed8" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof notificationListSchema>, NotificationListConfig> = true;
