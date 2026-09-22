import type { ConfigOf, Schema } from "@/lib/schema";
import type { CookieConsentConfig } from "./react/cookie-consent";

export const cookieConsentSchema = [
  {
    key: "title",
    label: "Title",
    group: "Content",
    type: "text",
    default: "Cookies on this site",
    maxLength: 60,
  },
  {
    key: "body",
    label: "Message",
    description: "Say plainly what the optional cookies are for.",
    group: "Content",
    type: "text",
    default:
      "We use cookies the site needs to work. With your permission we'd also like to use cookies to see how the site is used and to improve it.",
    maxLength: 300,
  },
  {
    key: "policyText",
    label: "Policy link text",
    description: "Leave empty to drop the link.",
    group: "Content",
    type: "text",
    default: "Read the cookie policy",
    maxLength: 60,
  },
  {
    key: "policyUrl",
    label: "Policy link",
    group: "Content",
    type: "text",
    default: "/cookies",
    maxLength: 200,
    format: "url",
  },
  {
    key: "categories",
    label: "Optional cookie types",
    description: "Each gets its own switch in the preferences, off until someone turns it on. The key is what your code checks.",
    group: "Content",
    type: "list",
    default: [
      { key: "analytics", name: "Analytics", description: "Counts visits and shows which pages are used, so we can improve them." },
      { key: "marketing", name: "Marketing", description: "Remembers your visit so ads elsewhere can be more relevant." },
    ],
    fields: [
      { key: "key", label: "Key", maxLength: 30 },
      { key: "name", label: "Name", maxLength: 40 },
      { key: "description", label: "What it does", maxLength: 160 },
    ],
    maxItems: 6,
    itemLabel: "Cookie type",
  },
  {
    key: "position",
    label: "Position",
    description: "A full-width bar along the bottom, or a card in the corner.",
    group: "Behaviour",
    type: "select",
    default: "bottom",
    options: ["bottom", "corner"],
  },
  {
    key: "storageKey",
    label: "Storage key",
    description: "Where the choice is kept in the browser (localStorage). Change it to ask everyone again.",
    group: "Behaviour",
    type: "text",
    default: "cookie-consent",
    maxLength: 40,
  },
  {
    key: "showReopen",
    label: "Cookie settings button",
    description: "Lets people change their mind later, which privacy law expects to be as easy as saying yes.",
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
    description: "Accept and Reject share it, so neither looks like the one to press.",
    group: "Style",
    type: "color",
    default: "#2563eb",
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof cookieConsentSchema>, CookieConsentConfig> = true;
