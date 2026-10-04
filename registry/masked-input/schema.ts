import type { ConfigOf, Schema } from "@/lib/schema";
import type { MaskedInputConfig } from "./react/masked-input";

export const maskedInputSchema = [
  { key: "label", label: "Label", group: "Content", type: "text", default: "Postcode", maxLength: 60 },
  { key: "hint", label: "Hint", description: "Empty uses the example built from the mask.", group: "Content", type: "text", default: "", maxLength: 120 },
  {
    key: "mask",
    label: "Mask",
    description: "# is a digit, A a letter, * either. Anything else is punctuation the field fills in: AA## #AA, ##/##/####, GB## AAAA ########.",
    group: "Behaviour",
    type: "text",
    default: "AA## #AA",
    maxLength: 40,
  },
  { key: "name", label: "Field name", group: "Behaviour", type: "text", default: "postcode", maxLength: 40 },
  { key: "showExample", label: "Show an example", group: "Add-ons", type: "boolean", default: true },
  { key: "errorText", label: "Incomplete message", group: "Content", type: "text", default: "That is not a full postcode yet.", maxLength: 120 },
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
    key: "exampleText",
    label: "Example",
    description: "Shown when the example is on. {example} is a made-up value.",
    group: "Words",
    type: "text",
    default: "Like {example}. We add the spacing.",
    maxLength: 120,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof maskedInputSchema>, MaskedInputConfig> = true;
