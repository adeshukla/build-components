import type { ConfigOf, Schema } from "@/lib/schema";
import type { PageHeaderConfig } from "./react/page-header";

export const pageHeaderSchema = [
  { key: "title", label: "Title", description: "The page's one h1. It is also the last step of the trail.", group: "Content", type: "text", default: "Accessibility statement", maxLength: 120 },
  { key: "lede", label: "Lede", description: "One sentence saying what the page is for. Leave it empty for none.", group: "Content", type: "text", default: "What this site does about access, what it has been tested with, and what to do if something here gets in your way.", maxLength: 300 },
  { key: "showTrail", label: "Show the trail", group: "Add-ons", type: "boolean", default: true },
  {
    key: "crumbs",
    label: "Trail",
    description: "The steps above this page. The current page is added at the end and is not a link.",
    group: "Content",
    type: "list",
    default: [
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
    ],
    fields: [
      { key: "label", label: "Label", maxLength: 40 },
      { key: "href", label: "Links to", maxLength: 300 },
    ],
    maxItems: 6,
    itemLabel: "Step",
  },
  { key: "primaryLabel", label: "Main action", description: "Leave it empty for none.", group: "Content", type: "text", default: "Report a problem", maxLength: 40 },
  { key: "primaryHref", label: "Main action goes to", group: "Content", type: "text", format: "url", default: "https://build-components.devstash.me/about", maxLength: 300 },
  { key: "secondaryLabel", label: "Second action", description: "Leave it empty for none.", group: "Content", type: "text", default: "How it is tested", maxLength: 40 },
  { key: "secondaryHref", label: "Second action goes to", group: "Content", type: "text", format: "url", default: "https://build-components.devstash.me/accessibility", maxLength: 300 },
  { key: "metaLabel", label: "Detail label", description: "A bare date says nothing about what it is.", group: "Content", type: "text", default: "Last reviewed", maxLength: 40 },
  { key: "metaValue", label: "Detail value", description: "Leave it empty for none.", group: "Content", type: "text", default: "24 September 2026", maxLength: 60 },
  { key: "align", label: "Alignment", group: "Style", type: "select", default: "left", options: ["left", "centre"] },
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
export const schemaMatchesComponent: Same<ConfigOf<typeof pageHeaderSchema>, PageHeaderConfig> = true;
