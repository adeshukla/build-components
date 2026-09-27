import type { ConfigOf, Schema } from "@/lib/schema";
import type { HoverCardConfig } from "./react/hover-card";

export const hoverCardSchema = [
  { key: "beforeText", label: "Text before the link", group: "Content", type: "text", default: "Pair this with ", maxLength: 120 },
  { key: "triggerText", label: "Link text", group: "Content", type: "text", default: "the searchable select", maxLength: 60 },
  { key: "afterText", label: "Text after the link", group: "Content", type: "text", default: " when the list runs past about fifteen options.", maxLength: 120 },
  { key: "linkHref", label: "Where the link goes", description: "http or https only.", group: "Content", type: "text", format: "url", default: "https://build-components.devstash.me/searchable-select", maxLength: 300 },
  { key: "cardTitle", label: "Card title", group: "Content", type: "text", default: "Searchable select", maxLength: 60 },
  { key: "cardMeta", label: "Card second line", group: "Content", type: "text", default: "APG Combobox · Inputs", maxLength: 80 },
  { key: "cardBody", label: "Card text", group: "Content", type: "text", default: "Type to filter a long list, pick with the keyboard or the mouse, with the matched letters marked.", maxLength: 240 },
  { key: "openDelayMs", label: "Wait before opening (ms)", description: "Long enough that the pointer crossing the link does not open it.", group: "Behaviour", type: "number", default: 300, min: 0, max: 2000 },
  { key: "closeDelayMs", label: "Wait before closing (ms)", description: "Long enough to move the pointer from the link onto the card.", group: "Behaviour", type: "number", default: 400, min: 0, max: 2000 },
  { key: "placement", label: "Card sits", group: "Style", type: "select", default: "below", options: ["above", "below"] },
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
export const schemaMatchesComponent: Same<ConfigOf<typeof hoverCardSchema>, HoverCardConfig> = true;
