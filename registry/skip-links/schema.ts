import type { ConfigOf, Schema } from "@/lib/schema";
import type { SkipLinksConfig } from "./react/skip-links";

export const skipLinksSchema = [
  {
    key: "links",
    label: "Links",
    description: "Target is the id of the landmark it jumps to, without the #.",
    group: "Content",
    type: "list",
    default: [
      { label: "Skip to main content", target: "main-content" },
      { label: "Skip to navigation", target: "site-nav" },
      { label: "Skip to search", target: "site-search" },
    ],
    fields: [
      { key: "label", label: "Label", maxLength: 60 },
      { key: "target", label: "Target id", maxLength: 60 },
    ],
    maxItems: 6,
    itemLabel: "Link",
  },
  { key: "alwaysVisible", label: "Always visible", description: "Some teams show them permanently rather than only on focus.", group: "Behaviour", type: "boolean", default: false },
  { key: "position", label: "Position", group: "Style", type: "select", default: "top-left", options: ["top-left", "top-centre"] },
  { key: "demoHeading", label: "Demo heading", description: "Only the stand-in page below the links; delete it in your own.", group: "Content", type: "text", default: "What the links skip to", maxLength: 80 },
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
export const schemaMatchesComponent: Same<ConfigOf<typeof skipLinksSchema>, SkipLinksConfig> = true;
