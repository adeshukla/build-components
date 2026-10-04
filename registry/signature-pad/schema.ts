import type { ConfigOf, Schema } from "@/lib/schema";
import type { SignaturePadConfig } from "./react/signature-pad";

export const signaturePadSchema = [
  { key: "label", label: "Label", group: "Content", type: "text", default: "Sign here", maxLength: 40 },
  { key: "hint", label: "Hint", group: "Content", type: "text", default: "Draw with a finger, a mouse or a stylus.", maxLength: 120 },
  {
    key: "typedAlternative",
    label: "Typed alternative",
    description: "Drawing needs a pointer. Without this the pad cannot be used by keyboard at all.",
    group: "Behaviour",
    type: "boolean",
    default: true,
  },
  { key: "typedLabel", label: "Typed field label", group: "Content", type: "text", default: "Or type your full name instead", maxLength: 60 },
  { key: "clearText", label: "Clear button", group: "Content", type: "text", default: "Clear", maxLength: 20 },
  { key: "confirmText", label: "Confirm button", group: "Content", type: "text", default: "Confirm signature", maxLength: 40 },
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
  {
    key: "typeInsteadText",
    label: "Type instead",
    description: "Added to the hint when typing a name is allowed.",
    group: "Words",
    type: "text",
    default: "A drawing needs a pointer, so you can type your name instead.",
    maxLength: 120,
  },
  {
    key: "clearedText",
    label: "Cleared",
    description: "Said after clearing.",
    group: "Words",
    type: "text",
    default: "Signature cleared",
    maxLength: 60,
  },
  {
    key: "drawnText",
    label: "Signed by drawing",
    description: "Said after confirming a drawing.",
    group: "Words",
    type: "text",
    default: "Signed by drawing",
    maxLength: 60,
  },
  {
    key: "typedText",
    label: "Signed by name",
    description: "Said after confirming a typed name. {name} is the name.",
    group: "Words",
    type: "text",
    default: "Signed as {name}",
    maxLength: 80,
  },
  {
    key: "signedText",
    label: "Signed",
    description: "Said while there is a signature.",
    group: "Words",
    type: "text",
    default: "There is a signature",
    maxLength: 60,
  },
  {
    key: "unsignedText",
    label: "Not signed",
    description: "Said before signing.",
    group: "Words",
    type: "text",
    default: "Nothing signed yet",
    maxLength: 60,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof signaturePadSchema>, SignaturePadConfig> = true;
