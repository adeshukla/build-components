import type { ConfigOf, Schema } from "@/lib/schema";
import type { SearchConfig } from "./react/search";

/** Example data, nested on purpose: guides inside sections, a guide inside a guide. */
const example = [
  {
    title: "Guides",
    children: [
      { title: "Getting started", description: "Install, configure and ship your first part", url: "/guides/start", tags: ["install", "setup"] },
      { title: "Theming", description: "Colours, dark mode and your own tokens", url: "/guides/theming", tags: ["dark mode", "colour"] },
      {
        title: "Accessibility",
        description: "How every part is tested",
        url: "/guides/accessibility",
        children: [
          { title: "Keyboard support", description: "Every key each part answers to", url: "/guides/accessibility/keyboard", tags: ["focus", "shortcuts"] },
          { title: "Screen readers", description: "What gets announced, and when", url: "/guides/accessibility/screen-readers", tags: ["aria", "voiceover", "nvda"] },
        ],
      },
    ],
  },
  {
    title: "Components",
    children: [
      { title: "Date picker", description: "One date or a range", url: "/date-picker", tags: ["calendar", "form"] },
      { title: "Data table", description: "Sortable rows that stack on a phone", url: "/table", tags: ["grid", "sort"] },
      { title: "Modal", description: "A dialog that keeps focus inside", url: "/modal", tags: ["dialog", "overlay"] },
    ],
  },
  {
    title: "People",
    children: [
      { title: "Alex Fisher", description: "Design systems lead", url: "/people/alex", tags: ["design"] },
      { title: "Sam Okafor", description: "Accessibility specialist", url: "/people/sam", tags: ["accessibility", "audit"] },
    ],
  },
];

export const searchSchema = [
  {
    key: "label",
    label: "Label",
    description: "Names the search. It is on the button, and screen readers read it in the box.",
    group: "Content",
    type: "text",
    default: "Search the site",
    maxLength: 60,
  },
  {
    key: "placeholder",
    label: "Placeholder",
    description: "Inside the box. It hints at what can be found; the label still names it.",
    group: "Content",
    type: "text",
    default: "Search pages, guides and people",
    maxLength: 80,
  },
  {
    key: "data",
    label: "Data to search",
    description:
      "Any JSON: an array, an object, nested as deep as you like. Every object with a title becomes a result, and the titles above it become its breadcrumb. A url and a description are used when present.",
    group: "Content",
    type: "text",
    default: JSON.stringify(example),
    maxLength: 20000,
  },
  {
    key: "emptyText",
    label: "No results text",
    description: "Shown and announced when nothing matches.",
    group: "Content",
    type: "text",
    default: "Nothing matches that. Try a shorter word.",
    maxLength: 120,
  },
  {
    key: "titleKey",
    label: "Title field",
    description: "Which key holds an item's name. Objects without it are containers, not results.",
    group: "Behaviour",
    type: "text",
    default: "title",
    maxLength: 30,
  },
  {
    key: "fields",
    label: "Fields to search",
    description: "Comma-separated keys. Lists of words, such as tags, are searched too. Empty means every field.",
    group: "Behaviour",
    type: "text",
    default: "title,description,tags",
    maxLength: 200,
  },
  {
    key: "layout",
    label: "Layout",
    description: "A button that opens a search dialog, or the box right there on the page.",
    group: "Behaviour",
    type: "select",
    default: "dialog",
    options: ["dialog", "inline"],
  },
  {
    key: "maxResults",
    label: "Most results",
    description: "The best matches are kept; the rest are left out.",
    group: "Behaviour",
    type: "number",
    default: 8,
    min: 1,
    max: 50,
  },
  {
    key: "shortcut",
    label: "⌘K / Ctrl+K",
    description: "Opens the dialog from anywhere on the page, and shows the shortcut on the button.",
    group: "Add-ons",
    type: "boolean",
    default: true,
    dependsOn: { key: "layout", equals: "dialog" },
  },
  {
    key: "groups",
    label: "Group results",
    description: "Under the top of their breadcrumb, e.g. Guides, Components, People.",
    group: "Add-ons",
    type: "boolean",
    default: true,
  },
  {
    key: "highlight",
    label: "Highlight the match",
    description: "Marks the part of each title that matched what was typed.",
    group: "Add-ons",
    type: "boolean",
    default: true,
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
    description: "The highlighted match and focus rings. Contrast-corrected before it is used as text.",
    group: "Style",
    type: "color",
    default: "#2563eb",
  },
  {
    key: "radius",
    label: "Corner radius (px)",
    description: "Roundness of the box, the dialog and each result.",
    group: "Style",
    type: "number",
    default: 12,
    min: 0,
    max: 24,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof searchSchema>, SearchConfig> = true;
