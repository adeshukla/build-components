import type { ConfigOf, Schema } from "@/lib/schema";
import type { PhoneInputConfig } from "./react/phone-input";

export const phoneInputSchema = [
  { key: "label", label: "Label", group: "Content", type: "text", default: "Phone number", maxLength: 60 },
  {
    key: "hint",
    label: "Hint",
    description: "Say what the number is for. People are wary of giving one.",
    group: "Content",
    type: "text",
    default: "We only use this to talk about your order.",
    maxLength: 160,
  },
  {
    key: "countries",
    label: "Countries",
    description: "Groups is how that country writes its numbers, e.g. “4 6” for 4 digits, a space, then 6.",
    group: "Content",
    type: "list",
    default: [
      { name: "United Kingdom", dial: "+44", groups: "4 6" },
      { name: "Ireland", dial: "+353", groups: "2 3 4" },
      { name: "United States", dial: "+1", groups: "3 3 4" },
      { name: "India", dial: "+91", groups: "5 5" },
      { name: "Germany", dial: "+49", groups: "4 7" },
    ],
    fields: [
      { key: "name", label: "Country", maxLength: 60 },
      { key: "dial", label: "Dial code", maxLength: 6 },
      { key: "groups", label: "Groups", maxLength: 20 },
    ],
    maxItems: 30,
    itemLabel: "Country",
  },
  { key: "startCountry", label: "Country at the start", group: "Behaviour", type: "text", default: "United Kingdom", maxLength: 60 },
  {
    key: "name",
    label: "Form field name",
    description: "Submits the dial code and digits together, e.g. +447700900123.",
    group: "Add-ons",
    type: "text",
    default: "phone",
    maxLength: 40,
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
  { key: "accentColor", label: "Accent colour", description: "The focus ring.", group: "Style", type: "color", default: "#2563eb" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof phoneInputSchema>, PhoneInputConfig> = true;
