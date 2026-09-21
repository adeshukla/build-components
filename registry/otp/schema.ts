import type { ConfigOf, Schema } from "@/lib/schema";
import type { OtpConfig } from "./react/otp";

export const otpSchema = [
  {
    key: "label",
    label: "Label",
    description: "What the code is for. It names the whole group, not one box.",
    group: "Content",
    type: "text",
    default: "Enter the code we sent you",
    maxLength: 80,
  },
  {
    key: "hint",
    label: "Hint",
    description: "How long the code is and where it came from.",
    group: "Content",
    type: "text",
    default: "Six digits, from the text message.",
    maxLength: 160,
  },
  {
    key: "completeText",
    label: "Complete message",
    description: "Announced once every box is filled.",
    group: "Content",
    type: "text",
    default: "Code complete.",
    maxLength: 80,
  },
  {
    key: "resendText",
    label: "Send again text",
    description: "A way out when the code never arrives. Leave empty to drop it.",
    group: "Content",
    type: "text",
    default: "Send it again",
    maxLength: 40,
  },
  {
    key: "length",
    label: "How many characters",
    description: "Six is the usual length for a code sent by text.",
    group: "Behaviour",
    type: "number",
    default: 6,
    min: 3,
    max: 10,
  },
  {
    key: "mode",
    label: "Layout",
    description:
      "Separate boxes, or one field. One field is simpler for screen readers and password managers; boxes are what people expect.",
    group: "Behaviour",
    type: "select",
    default: "boxes",
    options: ["boxes", "single"],
  },
  {
    key: "allowLetters",
    label: "Allow letters",
    description: "Off keeps it to digits and brings up the number keypad on a phone.",
    group: "Behaviour",
    type: "boolean",
    default: false,
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
    description: "Focus rings. Contrast-corrected before it is used.",
    group: "Style",
    type: "color",
    default: "#2563eb",
  },
  {
    key: "radius",
    label: "Corner radius (px)",
    description: "Roundness of each box.",
    group: "Style",
    type: "number",
    default: 10,
    min: 0,
    max: 24,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof otpSchema>, OtpConfig> = true;
