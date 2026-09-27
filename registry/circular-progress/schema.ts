import type { ConfigOf, Schema } from "@/lib/schema";
import type { CircularProgressConfig } from "./react/circular-progress";

export const circularProgressSchema = [
  { key: "label", label: "What is happening", group: "Content", type: "text", default: "Uploading photos", maxLength: 60 },
  { key: "mode", label: "Mode", description: "Indeterminate carries no value at all, because there is nothing honest to put there.", group: "Behaviour", type: "select", default: "determinate", options: ["determinate", "indeterminate"] },
  { key: "value", label: "Value (%)", group: "Behaviour", type: "number", default: 0, min: 0, max: 100 },
  { key: "unitText", label: "After the number", description: "\"62% uploaded\" beats \"62%\" on its own.", group: "Content", type: "text", default: "uploaded", maxLength: 40 },
  { key: "busyText", label: "Indeterminate wording", group: "Content", type: "text", default: "Working. This can take a minute.", maxLength: 100 },
  { key: "doneText", label: "When it reaches 100", group: "Content", type: "text", default: "All photos uploaded.", maxLength: 100 },
  { key: "runLabel", label: "Demo button", description: "Only the stand-in; point setValue at your own upload.", group: "Content", type: "text", default: "Start the upload", maxLength: 40 },
  { key: "demoMs", label: "Stand-in run takes (ms)", group: "Behaviour", type: "number", default: 2400, min: 300, max: 10000 },
  { key: "size", label: "Diameter (px)", group: "Style", type: "number", default: 96, min: 40, max: 240 },
  { key: "thickness", label: "Ring thickness (px)", group: "Style", type: "number", default: 10, min: 2, max: 40 },
  { key: "showValue", label: "Number on the face", group: "Add-ons", type: "boolean", default: true },
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
export const schemaMatchesComponent: Same<ConfigOf<typeof circularProgressSchema>, CircularProgressConfig> = true;
