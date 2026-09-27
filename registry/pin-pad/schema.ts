import type { ConfigOf, Schema } from "@/lib/schema";
import type { PinPadConfig } from "./react/pin-pad";

export const pinPadSchema = [
  { key: "legend", label: "Heading", group: "Content", type: "text", default: "Enter your PIN", maxLength: 80 },
  { key: "hint", label: "Hint", description: "Leave it empty for none.", group: "Content", type: "text", default: "Four digits. Use the pad or type them.", maxLength: 140 },
  { key: "length", label: "How many digits", group: "Behaviour", type: "number", default: 4, min: 3, max: 10 },
  { key: "name", label: "Field name", group: "Behaviour", type: "text", default: "pin", maxLength: 40 },
  { key: "layout", label: "Pad order", description: "Phone puts 1 at the top; calculator puts 7 there.", group: "Behaviour", type: "select", default: "phone", options: ["phone", "calculator"] },
  { key: "deleteLabel", label: "Delete button name", description: "The button shows ⌫; this is what it is called.", group: "Content", type: "text", default: "Delete last digit", maxLength: 60 },
  { key: "clearLabel", label: "Clear button", group: "Content", type: "text", default: "Clear", maxLength: 20 },
  { key: "showClear", label: "Show the clear key", group: "Add-ons", type: "boolean", default: true },
  { key: "completeText", label: "Message when full", group: "Content", type: "text", default: "PIN complete.", maxLength: 80 },
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
export const schemaMatchesComponent: Same<ConfigOf<typeof pinPadSchema>, PinPadConfig> = true;
