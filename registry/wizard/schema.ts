import type { ConfigOf, Schema } from "@/lib/schema";
import type { WizardConfig } from "./react/wizard";

export const wizardSchema = [
  { key: "heading", label: "Heading", group: "Content", type: "text", default: "Book a refit", maxLength: 60 },
  {
    key: "steps",
    label: "Steps",
    description: "One field per step. A step marked needed cannot be walked past empty.",
    group: "Content",
    type: "list",
    default: [
      { title: "Your boat", label: "Boat name", required: "yes" },
      { title: "The work", label: "What needs doing", required: "yes" },
      { title: "When", label: "Month you would like", required: "no" },
      { title: "Contact", label: "Email address", required: "yes" },
    ],
    fields: [
      { key: "title", label: "Step title", maxLength: 40 },
      { key: "label", label: "Field label", maxLength: 40 },
      { key: "required", label: "Needed? yes / no", maxLength: 3 },
    ],
    maxItems: 10,
    itemLabel: "Step",
  },
  { key: "backText", label: "Back button", group: "Content", type: "text", default: "Back", maxLength: 20 },
  { key: "nextText", label: "Next button", group: "Content", type: "text", default: "Next", maxLength: 20 },
  { key: "finishText", label: "Last button", group: "Content", type: "text", default: "Send it", maxLength: 20 },
  { key: "showProgress", label: "Step list", description: "The steps written out, with the current one marked.", group: "Add-ons", type: "boolean", default: true },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#1d4ed8" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof wizardSchema>, WizardConfig> = true;
