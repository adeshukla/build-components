import type { ConfigOf, Schema } from "@/lib/schema";
import type { OrderTrackerConfig } from "./react/order-tracker";

export const orderTrackerSchema = [
  { key: "heading", label: "Heading", group: "Content", type: "text", default: "Where your order is", maxLength: 80 },
  { key: "reference", label: "Reference", group: "Content", type: "text", default: "Order 4812-A", maxLength: 60 },
  {
    key: "steps",
    label: "Steps",
    description: "Leave a date empty where there is not one yet. Do not invent one.",
    group: "Content",
    type: "list",
    default: [
      { label: "Ordered", detail: "Payment taken in full.", date: "2026-09-24" },
      { label: "Packed", detail: "Two parcels, packed together.", date: "2026-09-25" },
      { label: "With the courier", detail: "Picked up from the warehouse in Reading.", date: "2026-09-26" },
      { label: "Out for delivery", detail: "Expected between 09:00 and 13:00.", date: "2026-09-28" },
      { label: "Delivered", detail: "Signature needed at the door.", date: "" },
    ],
    fields: [
      { key: "label", label: "Step", maxLength: 60 },
      { key: "detail", label: "Detail", maxLength: 160 },
      { key: "date", label: "Date", maxLength: 10 },
    ],
    maxItems: 12,
    itemLabel: "Step",
  },
  { key: "currentStep", label: "Current step", description: "Counting from 1.", group: "Behaviour", type: "number", default: 4, min: 1, max: 12 },
  { key: "currentWord", label: "Current wording", group: "Content", type: "text", default: "Happening now", maxLength: 40 },
  { key: "doneWord", label: "Finished wording", group: "Content", type: "text", default: "Done", maxLength: 40 },
  { key: "todoWord", label: "Not yet wording", group: "Content", type: "text", default: "Still to come", maxLength: 40 },
  { key: "layout", label: "Layout", description: "Vertical reads better on a phone; horizontal fits a wide summary.", group: "Style", type: "select", default: "vertical", options: ["vertical", "horizontal"] },
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
export const schemaMatchesComponent: Same<ConfigOf<typeof orderTrackerSchema>, OrderTrackerConfig> = true;
