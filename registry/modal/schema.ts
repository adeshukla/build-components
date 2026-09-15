import type { ConfigOf, Schema } from "@/lib/schema";
import type { ModalConfig } from "./react/modal";

export const modalSchema = [
  { key: "triggerText", label: "Trigger button text", group: "Content", type: "text", default: "Open dialog", maxLength: 40 },
  { key: "title", label: "Title", group: "Content", type: "text", default: "Subscribe to updates", maxLength: 80 },
  {
    key: "body",
    label: "Body text",
    group: "Content",
    type: "text",
    default: "Get an email when new components are released. Unsubscribe any time.",
    maxLength: 300,
  },
  { key: "primaryText", label: "Primary button text", group: "Content", type: "text", default: "Confirm", maxLength: 30 },
  {
    key: "initialFocus",
    label: "Focus when opened",
    group: "Behaviour",
    type: "select",
    default: "title",
    options: ["title", "primary"],
  },
  { key: "closeOnBackdrop", label: "Close on backdrop click", group: "Behaviour", type: "boolean", default: true },
  { key: "position", label: "Position", group: "Behaviour", type: "select", default: "center", options: ["center", "bottom"] },
  {
    key: "animation",
    label: "Open animation",
    group: "Behaviour",
    type: "select",
    default: "fade",
    options: ["none", "fade", "scale"],
  },
  { key: "closeButton", label: "Close (×) button", group: "Add-ons", type: "boolean", default: true },
  { key: "secondaryButton", label: "Secondary button", group: "Add-ons", type: "boolean", default: true },
  {
    key: "secondaryText",
    label: "Secondary button text",
    group: "Add-ons",
    type: "text",
    default: "Cancel",
    maxLength: 30,
    dependsOn: { key: "secondaryButton", equals: true },
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#2563eb" },
  { key: "radius", label: "Corner radius (px)", group: "Style", type: "number", default: 8, min: 0, max: 24 },
  { key: "size", label: "Width", group: "Style", type: "select", default: "md", options: ["sm", "md", "lg"] },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof modalSchema>, ModalConfig> = true;
