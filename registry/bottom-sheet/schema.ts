import type { ConfigOf, Schema } from "@/lib/schema";
import type { BottomSheetConfig } from "./react/bottom-sheet";

export const bottomSheetSchema = [
  { key: "triggerLabel", label: "Opening button", group: "Content", type: "text", default: "Choose a delivery slot", maxLength: 60 },
  { key: "title", label: "Sheet title", group: "Content", type: "text", default: "Delivery slot", maxLength: 60 },
  { key: "body", label: "Sheet text", group: "Content", type: "text", default: "Sheets come up from the bottom because that is where the thumb is. This one has three heights, and the handle is a real button so the heights are reachable without dragging.", maxLength: 400 },
  { key: "confirmLabel", label: "Confirm button", group: "Content", type: "text", default: "Use this slot", maxLength: 40 },
  { key: "cancelLabel", label: "Close button", group: "Content", type: "text", default: "Close", maxLength: 40 },
  { key: "detents", label: "Heights it offers", group: "Behaviour", type: "select", default: "peek-half-full", options: ["peek-half-full", "half-full", "full"] },
  { key: "startAt", label: "Opens at", group: "Behaviour", type: "select", default: "half", options: ["peek", "half", "full"] },
  { key: "expandLabel", label: "Handle name, taller", description: "The handle is a button, so it needs a name in words.", group: "Content", type: "text", default: "Make the sheet taller", maxLength: 60 },
  { key: "collapseLabel", label: "Handle name, shorter", group: "Content", type: "text", default: "Make the sheet shorter", maxLength: 60 },
  { key: "centreOnWide", label: "Centre it on a wide screen", description: "A sheet stuck to the bottom of a desktop window is a phone pattern in the wrong place.", group: "Behaviour", type: "boolean", default: true },
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
export const schemaMatchesComponent: Same<ConfigOf<typeof bottomSheetSchema>, BottomSheetConfig> = true;
