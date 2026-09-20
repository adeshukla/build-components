import type { ConfigOf, Schema } from "@/lib/schema";
import type { BreadcrumbsConfig } from "./react/breadcrumbs";

export const breadcrumbsSchema = [
  {
    key: "label",
    label: "Trail name",
    description: "Names this navigation for screen readers. “Breadcrumb” is what people expect.",
    group: "Content",
    type: "text",
    default: "Breadcrumb",
    maxLength: 40,
  },
  {
    key: "items",
    label: "Steps",
    description: "From the top of the site to this page. The last one is the page you are on, so it needs no link.",
    group: "Content",
    type: "list",
    default: [
      { label: "Home", href: "/" },
      { label: "Catalogue", href: "/catalogue" },
      { label: "Navigation", href: "/catalogue/navigation" },
      { label: "Breadcrumbs", href: "" },
    ],
    fields: [
      { key: "label", label: "Text", maxLength: 60 },
      { key: "href", label: "Link", maxLength: 200, format: "url" },
    ],
    maxItems: 8,
    itemLabel: "Step",
  },
  {
    key: "collapse",
    label: "Collapse on a phone",
    description: "Shows the first step and the current page, with a gap for the steps between.",
    group: "Behaviour",
    type: "boolean",
    default: true,
  },
  {
    key: "homeIcon",
    label: "Home icon",
    description: "A small house beside the first step. The text stays, so it is never icon-only.",
    group: "Add-ons",
    type: "boolean",
    default: true,
  },
  {
    key: "separator",
    label: "Separator",
    description: "The mark between steps. It is decoration, and screen readers skip it.",
    group: "Style",
    type: "select",
    default: "chevron",
    options: ["chevron", "slash", "arrow"],
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
    description: "Link hover and focus. Contrast-corrected before it is used as text.",
    group: "Style",
    type: "color",
    default: "#2563eb",
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof breadcrumbsSchema>, BreadcrumbsConfig> = true;
