import type { ConfigOf, Schema } from "@/lib/schema";
import type { LanguageSwitcherConfig } from "./react/language-switcher";

export const languageSwitcherSchema = [
  { key: "label", label: "Label", description: "Read before the current language.", group: "Content", type: "text", default: "Language", maxLength: 40 },
  {
    key: "languages",
    label: "Languages",
    description: "Write each name in its own language (Français, not French). The code becomes lang and hreflang.",
    group: "Content",
    type: "list",
    default: [
      { name: "English", code: "en", url: "/en" },
      { name: "Français", code: "fr", url: "/fr" },
      { name: "Deutsch", code: "de", url: "/de" },
      { name: "Español", code: "es", url: "/es" },
      { name: "हिन्दी", code: "hi", url: "/hi" },
    ],
    fields: [
      { key: "name", label: "Name", maxLength: 40 },
      { key: "code", label: "Code", maxLength: 8 },
      { key: "url", label: "Link", maxLength: 200, format: "url" },
    ],
    maxItems: 20,
    itemLabel: "Language",
  },
  { key: "currentCode", label: "Current language code", group: "Behaviour", type: "text", default: "en", maxLength: 8 },
  { key: "showCode", label: "Show the code", description: "EN, FR, and so on beside each name.", group: "Style", type: "boolean", default: true },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", description: "The focus ring.", group: "Style", type: "color", default: "#2563eb" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof languageSwitcherSchema>, LanguageSwitcherConfig> = true;
