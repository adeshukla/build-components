import type { ConfigOf, Schema } from "@/lib/schema";
import type { ErrorStateConfig } from "./react/error-state";

export const errorStateSchema = [
  { key: "triggerLabel", label: "Demo button", description: "Only the stand-in request; point attempt() at your own.", group: "Content", type: "text", default: "Load the report", maxLength: 60 },
  { key: "heading", label: "Heading", description: "Name what failed, not \"Oops\" or \"Something went wrong\".", group: "Content", type: "text", default: "The report did not load", maxLength: 80 },
  { key: "headingLevel", label: "Heading level", group: "Content", type: "select", default: "h2", options: ["h2", "h3"] },
  { key: "message", label: "What happened", group: "Content", type: "text", default: "The server took too long to answer.", maxLength: 160 },
  { key: "advice", label: "What to do", description: "Say whether anything changed. That is the first thing anyone wants to know.", group: "Content", type: "text", default: "Nothing was changed. Try again, or come back in a few minutes.", maxLength: 200 },
  { key: "retryLabel", label: "Retry button", group: "Content", type: "text", default: "Try again", maxLength: 40 },
  { key: "showDetails", label: "Technical detail", group: "Add-ons", type: "boolean", default: true },
  { key: "detailsLabel", label: "Detail summary", group: "Content", type: "text", default: "Technical detail", maxLength: 40 },
  { key: "detailsText", label: "Detail text", group: "Content", type: "text", default: "GET /api/reports/2026-q1 — 504 Gateway Timeout after 30s", maxLength: 200 },
  { key: "okText", label: "When it works", group: "Content", type: "text", default: "Report loaded.", maxLength: 100 },
  { key: "retrySucceeds", label: "The retry works", description: "Only the stand-in: turn it off to keep the failed state on screen.", group: "Behaviour", type: "boolean", default: true },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or follow the device.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#b42318" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof errorStateSchema>, ErrorStateConfig> = true;
