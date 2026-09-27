import type { ConfigOf, Schema } from "@/lib/schema";
import type { AnchorNavConfig } from "./react/anchor-nav";

export const anchorNavSchema = [
  { key: "heading", label: "Nav heading", group: "Content", type: "text", default: "On this page", maxLength: 60 },
  {
    key: "sections",
    label: "Sections",
    description: "Target is the id of the heading it jumps to. Body is only the stand-in page below.",
    group: "Content",
    type: "list",
    default: [
      { label: "What it does", target: "what", body: "A table of contents for one page, marking whichever section you are reading." },
      { label: "Installing it", target: "install", body: "Copy the file, or install it by URL. There is no package behind it." },
      { label: "Options", target: "options", body: "Every option is in the panel beside this preview, and in the URL." },
      { label: "Accessibility notes", target: "notes", body: "What was decided and why, in the checklist under the bench." },
    ],
    fields: [
      { key: "label", label: "Label", maxLength: 60 },
      { key: "target", label: "Target id", maxLength: 60 },
      { key: "body", label: "Demo text", maxLength: 160 },
    ],
    maxItems: 20,
    itemLabel: "Section",
  },
  { key: "sticky", label: "Stick while scrolling", description: "Only from 768px up; on a phone it stays at the top of the page.", group: "Behaviour", type: "boolean", default: true },
  { key: "markCurrent", label: "Mark the section being read", group: "Behaviour", type: "boolean", default: true },
  { key: "smoothScroll", label: "Scroll smoothly", description: "Ignored for anyone who asks for less motion.", group: "Behaviour", type: "boolean", default: true },
  { key: "numbered", label: "Number the links", group: "Add-ons", type: "boolean", default: false },
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
export const schemaMatchesComponent: Same<ConfigOf<typeof anchorNavSchema>, AnchorNavConfig> = true;
