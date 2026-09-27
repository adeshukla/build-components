import type { ConfigOf, Schema } from "@/lib/schema";
import type { ErrorSummaryConfig } from "./react/error-summary";

export const errorSummarySchema = [
  { key: "legend", label: "Form heading", group: "Content", type: "text", default: "Your details", maxLength: 80 },
  { key: "heading", label: "Summary heading", group: "Content", type: "text", default: "There is a problem", maxLength: 80 },
  { key: "headingLevel", label: "Summary heading level", description: "Fit it under whatever heading the page already has.", group: "Content", type: "select", default: "h2", options: ["h2", "h3"] },
  { key: "countInHeading", label: "Count in the heading", description: "\"3 problems to fix\" instead of your wording.", group: "Content", type: "boolean", default: false },
  {
    key: "fields",
    label: "Fields",
    description: "Kind is text, email or tel. Required is yes or no.",
    group: "Content",
    type: "list",
    default: [
      { label: "Full name", kind: "text", required: "yes" },
      { label: "Email address", kind: "email", required: "yes" },
      { label: "Phone number", kind: "tel", required: "no" },
    ],
    fields: [
      { key: "label", label: "Label", maxLength: 40 },
      { key: "kind", label: "Kind", maxLength: 10 },
      { key: "required", label: "Required", maxLength: 3 },
    ],
    maxItems: 10,
    itemLabel: "Field",
  },
  { key: "submitLabel", label: "Submit button", group: "Content", type: "text", default: "Continue", maxLength: 40 },
  { key: "successText", label: "Message when it passes", group: "Content", type: "text", default: "Thank you. Your details were accepted.", maxLength: 120 },
  { key: "markFields", label: "Repeat the message at the field", description: "The summary alone leaves nothing next to the answer being changed.", group: "Behaviour", type: "boolean", default: true },
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
export const schemaMatchesComponent: Same<ConfigOf<typeof errorSummarySchema>, ErrorSummaryConfig> = true;
