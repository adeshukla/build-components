import type { ConfigOf, Schema } from "@/lib/schema";
import type { FeatureGridConfig } from "./react/feature-grid";

export const featureGridSchema = [
  { key: "heading", label: "Heading", group: "Content", type: "text", default: "What you get", maxLength: 80 },
  { key: "intro", label: "Intro", description: "Leave it empty for none.", group: "Content", type: "text", default: "Every part is tested the same way before it goes in the catalogue.", maxLength: 200 },
  {
    key: "items",
    label: "Features",
    description: "The glyph is decoration and is hidden from screen readers. A link is optional per feature.",
    group: "Content",
    type: "list",
    default: [
      { title: "Two outputs", text: "React with Tailwind, or plain HTML, CSS and JavaScript. Both tested, neither a wrapper around the other.", glyph: "❏", href: "" },
      { title: "No dependency", text: "You copy the files. There is no package to install and nothing to keep up to date.", glyph: "✦", href: "" },
      { title: "Accessible first", text: "Keyboard paths, screen-reader wording and colour contrast are part of the definition of done.", glyph: "☼", href: "/accessibility" },
      { title: "Configured visually", text: "Set the options on the page, watch the real component change, then take the file.", glyph: "◈", href: "" },
      { title: "Dark mode included", text: "Light, dark or the visitor's own setting, in the exported file rather than a separate sheet.", glyph: "◐", href: "" },
      { title: "Yours afterwards", text: "Rename it, cut the options you do not need, fold it into your own components.", glyph: "✎", href: "" },
    ],
    fields: [
      { key: "title", label: "Title", maxLength: 60 },
      { key: "text", label: "Text", maxLength: 240 },
      { key: "glyph", label: "Glyph", maxLength: 4 },
      { key: "href", label: "Link", maxLength: 200, format: "url" },
    ],
    maxItems: 16,
    itemLabel: "Feature",
  },
  { key: "columns", label: "Columns on a wide screen", group: "Style", type: "select", default: "three", options: ["two", "three", "four"] },
  { key: "linkText", label: "Link wording", description: "The feature name is added after it for screen readers.", group: "Content", type: "text", default: "Read more", maxLength: 30 },
  { key: "showRule", label: "Line above each feature", group: "Style", type: "boolean", default: true },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or follow the device.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", description: "Glyphs and links.", group: "Style", type: "color", default: "#0f766e" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof featureGridSchema>, FeatureGridConfig> = true;
