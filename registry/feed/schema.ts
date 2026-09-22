import type { ConfigOf, Schema } from "@/lib/schema";
import type { FeedConfig } from "./react/feed";

export const feedSchema = [
  {
    key: "label",
    label: "Name",
    description: "Shown above the list and names the feed for screen readers.",
    group: "Content",
    type: "text",
    default: "Latest updates",
    maxLength: 60,
  },
  {
    key: "items",
    label: "Items",
    description: "Example content. In your code, the next page comes from your server.",
    group: "Content",
    type: "list",
    default: [
      { title: "Search now finds partial words", summary: "Typing “acc” finds accordion and accessibility." },
      { title: "Dark mode follows your device", summary: "Every part can switch with the operating system." },
      { title: "New: time picker", summary: "Type a time any common way, or pick from a list." },
      { title: "Drawers close with a swipe", summary: "On touch screens, swipe toward the edge to close." },
      { title: "Cookie banner added", summary: "Accept and reject are equals, and nothing is ticked in advance." },
      { title: "Tables stack on phones", summary: "Each row becomes a card with its labels kept." },
      { title: "Sortable lists without dragging", summary: "Move buttons and the keyboard reorder too." },
      { title: "Faster first load", summary: "Fonts and scripts load only where they are used." },
      { title: "Tree view added", summary: "Folders as deep as you like, with type-ahead." },
      { title: "Carousel pauses on focus", summary: "Rotation stops the moment you reach it with a key." },
    ],
    fields: [
      { key: "title", label: "Title", maxLength: 80 },
      { key: "summary", label: "Summary", maxLength: 160 },
    ],
    maxItems: 40,
    itemLabel: "Item",
  },
  {
    key: "pageSize",
    label: "Items per load",
    group: "Behaviour",
    type: "number",
    default: 4,
    min: 1,
    max: 20,
  },
  {
    key: "mode",
    label: "Loading",
    description: "On a button press, or also as the end scrolls into view. The button stays either way.",
    group: "Behaviour",
    type: "select",
    default: "button",
    options: ["button", "scroll"],
  },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  {
    key: "accentColor",
    label: "Accent colour",
    description: "The focus ring.",
    group: "Style",
    type: "color",
    default: "#2563eb",
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof feedSchema>, FeedConfig> = true;
