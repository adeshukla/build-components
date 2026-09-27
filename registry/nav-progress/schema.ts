import type { ConfigOf, Schema } from "@/lib/schema";
import type { NavProgressConfig } from "./react/nav-progress";

export const navProgressSchema = [
  { key: "triggerLabel", label: "Demo button", description: "Only the stand-in navigation; point start() at your own router instead.", group: "Content", type: "text", default: "Go to the next page", maxLength: 60 },
  { key: "pageName", label: "Page it lands on", description: "Named in the announcement, because \"loaded\" alone says nothing.", group: "Content", type: "text", default: "Parts catalogue", maxLength: 60 },
  { key: "loadingText", label: "While loading", group: "Content", type: "text", default: "Loading", maxLength: 40 },
  { key: "doneText", label: "When it arrives", group: "Content", type: "text", default: "Loaded", maxLength: 40 },
  { key: "delayMs", label: "Wait before drawing (ms)", description: "A bar that flashes for 80ms is worse than no bar at all.", group: "Behaviour", type: "number", default: 200, min: 0, max: 2000 },
  { key: "demoMs", label: "Stand-in load takes (ms)", group: "Behaviour", type: "number", default: 1400, min: 100, max: 8000 },
  { key: "position", label: "Position", group: "Style", type: "select", default: "top", options: ["top", "bottom"] },
  { key: "thickness", label: "Thickness (px)", group: "Style", type: "number", default: 3, min: 1, max: 12 },
  { key: "showBar", label: "Draw the bar", description: "The announcement works on its own; the bar is for the people who can see it.", group: "Add-ons", type: "boolean", default: true },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or follow the device.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#e6b24a" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof navProgressSchema>, NavProgressConfig> = true;
