import type { ConfigOf, Schema } from "@/lib/schema";
import type { HelpHintConfig } from "./react/help-hint";

export const helpHintSchema = [
  { key: "label", label: "Field label", group: "Content", type: "text", default: "National Insurance number", maxLength: 80 },
  { key: "shortHint", label: "Short hint", description: "Always visible. The help behind the button is the long version.", group: "Content", type: "text", default: "It is on your payslip, P60 or letters about tax.", maxLength: 160 },
  { key: "buttonLabel", label: "Help button", description: "Named in words. A lone question mark is not a name.", group: "Content", type: "text", default: "Help with this answer", maxLength: 60 },
  { key: "helpTitle", label: "Help heading", group: "Content", type: "text", default: "Where to find it", maxLength: 60 },
  { key: "helpText", label: "Help text", group: "Content", type: "text", default: "Two letters, six digits and one more letter. It is printed on your payslip, on a P60, and on letters from HMRC about tax, pensions or benefits.", maxLength: 400 },
  { key: "exampleText", label: "Example", description: "Leave it empty for none.", group: "Content", type: "text", default: "For example, QQ 12 34 56 C", maxLength: 100 },
  { key: "placeholder", label: "Placeholder", description: "Usually leave it empty: a placeholder disappears as soon as anyone types.", group: "Content", type: "text", default: "", maxLength: 60 },
  { key: "name", label: "Field name", group: "Behaviour", type: "text", default: "nino", maxLength: 40 },
  { key: "startOpen", label: "Start open", description: "Worth turning on when most people need the help.", group: "Behaviour", type: "boolean", default: false },
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
export const schemaMatchesComponent: Same<ConfigOf<typeof helpHintSchema>, HelpHintConfig> = true;
