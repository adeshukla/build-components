import type { ConfigOf, Schema } from "@/lib/schema";
import type { NewsletterConfig } from "./react/newsletter";

export const newsletterSchema = [
  { key: "heading", label: "Heading", group: "Content", type: "text", default: "Notes from the yard", maxLength: 60 },
  { key: "copy", label: "Paragraph", description: "Say what they will get and how often.", group: "Content", type: "text", default: "What we have been fixing, and what we learnt doing it. Once a month, no more.", maxLength: 200 },
  { key: "emailLabel", label: "Field label", group: "Content", type: "text", default: "Email address", maxLength: 40 },
  { key: "placeholder", label: "Placeholder", description: "Usually better empty: a label is read out, a placeholder is not.", group: "Content", type: "text", default: "", maxLength: 60 },
  { key: "buttonText", label: "Button", group: "Content", type: "text", default: "Sign me up", maxLength: 30 },
  { key: "name", label: "Field name", group: "Behaviour", type: "text", default: "email", maxLength: 40 },
  { key: "requireConsent", label: "Consent box", description: "Needed in the UK and EU for marketing email.", group: "Behaviour", type: "boolean", default: true },
  { key: "consentText", label: "Consent wording", group: "Content", type: "text", default: "Yes, send me the monthly note.", maxLength: 160 },
  { key: "note", label: "Small print", group: "Content", type: "text", default: "One email a month. Unsubscribe from any of them.", maxLength: 160 },
  { key: "successText", label: "After signing up", group: "Content", type: "text", default: "Thanks — check your inbox to confirm it is you.", maxLength: 160 },
  { key: "layout", label: "Layout", group: "Style", type: "select", default: "inline", options: ["inline", "stacked"] },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or follow the device.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#0f766e" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof newsletterSchema>, NewsletterConfig> = true;
