import type { ConfigOf, Schema } from "@/lib/schema";
import type { ContactDetailsConfig } from "./react/contact-details";

export const contactDetailsSchema = [
  { key: "heading", label: "Heading", group: "Content", type: "text", default: "Get in touch", maxLength: 120 },
  { key: "headingLevel", label: "Heading level", group: "Content", type: "select", default: "h2", options: ["h2", "h3"] },
  { key: "intro", label: "Intro", description: "Leave it empty for none.", group: "Content", type: "text", default: "Write, call or come by. We answer every message within two working days.", maxLength: 300 },
  { key: "email", label: "Email", description: "Becomes a link that opens a new message. Empty hides it.", group: "Content", type: "text", default: "hello@example.com", maxLength: 120 },
  { key: "phone", label: "Phone", description: "Becomes a link that calls it on a phone. Empty hides it.", group: "Content", type: "text", default: "+1 555 0100", maxLength: 40 },
  { key: "address", label: "Address", description: "One line per line of the address. Empty hides it.", group: "Content", type: "text", default: "[TODO: street and number]\n[TODO: town and postcode]", maxLength: 300 },
  { key: "hours", label: "Opening hours", description: "Empty hides it.", group: "Content", type: "text", default: "Monday to Friday, 9:00 to 17:00", maxLength: 160 },
  { key: "mapText", label: "Map link text", group: "Add-ons", type: "text", default: "Open in a map", maxLength: 60 },
  { key: "mapHref", label: "Map link", description: "A link to your place on a map. Empty hides it.", group: "Add-ons", type: "text", format: "url", default: "", maxLength: 300 },
  { key: "theme", label: "Theme", group: "Style", type: "select", default: "light", options: ["light", "dark", "system"] },
  { key: "accentColor", label: "Accent colour", description: "The links, darkened if needed to stay readable.", group: "Style", type: "color", default: "#2563eb" },
  {
    key: "emailTerm",
    label: "Email",
    description: "Names the email address.",
    group: "Words",
    type: "text",
    default: "Email",
    maxLength: 30,
  },
  {
    key: "phoneTerm",
    label: "Phone",
    description: "Names the phone number.",
    group: "Words",
    type: "text",
    default: "Phone",
    maxLength: 30,
  },
  {
    key: "addressTerm",
    label: "Address",
    description: "Names the address.",
    group: "Words",
    type: "text",
    default: "Address",
    maxLength: 30,
  },
  {
    key: "hoursTerm",
    label: "Opening hours",
    description: "Names the opening hours.",
    group: "Words",
    type: "text",
    default: "Opening hours",
    maxLength: 40,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof contactDetailsSchema>, ContactDetailsConfig> = true;
