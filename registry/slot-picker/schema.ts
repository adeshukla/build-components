import type { ConfigOf, Schema } from "@/lib/schema";
import type { SlotPickerConfig } from "./react/slot-picker";

export const slotPickerSchema = [
  { key: "heading", label: "Heading", group: "Content", type: "text", default: "Pick a time", maxLength: 60 },
  {
    key: "slots",
    label: "Slots",
    description: "Slots sharing a day are grouped under it. State is free or taken; taken cannot be picked.",
    group: "Content",
    type: "list",
    default: [
      { day: "Thursday 5 March", time: "09:00", state: "free" },
      { day: "Thursday 5 March", time: "09:30", state: "taken" },
      { day: "Thursday 5 March", time: "10:00", state: "free" },
      { day: "Thursday 5 March", time: "10:30", state: "free" },
      { day: "Friday 6 March", time: "11:00", state: "free" },
      { day: "Friday 6 March", time: "11:30", state: "taken" },
      { day: "Friday 6 March", time: "14:00", state: "free" },
      { day: "Monday 9 March", time: "09:00", state: "free" },
      { day: "Monday 9 March", time: "15:30", state: "free" },
    ],
    fields: [
      { key: "day", label: "Day", maxLength: 40 },
      { key: "time", label: "Time", maxLength: 12 },
      { key: "state", label: "free / taken", maxLength: 5 },
    ],
    maxItems: 60,
    itemLabel: "Slot",
  },
  {
    key: "timezoneNote",
    label: "Time zone note",
    description: "Say whose time zone these are. Times are printed as written, never converted.",
    group: "Content",
    type: "text",
    default: "Times are shown in your device's own time zone.",
    maxLength: 120,
  },
  { key: "confirmText", label: "Confirm button", group: "Content", type: "text", default: "Confirm this time", maxLength: 40 },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#0f766e" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof slotPickerSchema>, SlotPickerConfig> = true;
