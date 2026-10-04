import type { ConfigOf, Schema } from "@/lib/schema";
import type { StickyHeaderConfig } from "./react/sticky-header";

export const stickyHeaderSchema = [
  { key: "title", label: "Title", group: "Content", type: "text", default: "Ledger", maxLength: 40 },
  {
    key: "links",
    label: "Links",
    group: "Content",
    type: "list",
    default: [{ label: "Overview" }, { label: "Entries" }, { label: "Reports" }, { label: "Settings" }],
    fields: [{ key: "label", label: "Label", maxLength: 30 }],
    maxItems: 8,
    itemLabel: "Link",
  },
  { key: "actionLabel", label: "Action button", group: "Content", type: "text", default: "New entry", maxLength: 30 },
  { key: "shrink", label: "Shrink past the threshold", group: "Behaviour", type: "boolean", default: true },
  { key: "hideOnScrollDown", label: "Step out of the way going down", description: "Ignored for anyone who asks for less motion, and on a short screen.", group: "Behaviour", type: "boolean", default: true },
  { key: "threshold", label: "Threshold (px)", description: "How far down before either of those happens.", group: "Behaviour", type: "number", default: 80, min: 0, max: 600 },
  { key: "demoSections", label: "Sections to scroll", description: "Only the stand-in page under the header.", group: "Behaviour", type: "number", default: 6, min: 1, max: 20 },
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
  {
    key: "navLabel",
    label: "Links label",
    description: "Names the row of links, for screen readers.",
    group: "Words",
    type: "text",
    default: "Sections",
    maxLength: 40,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof stickyHeaderSchema>, StickyHeaderConfig> = true;
