import type { ConfigOf, Schema } from "@/lib/schema";
import type { TimePickerConfig } from "./react/time-picker";

export const timePickerSchema = [
  {
    key: "label",
    label: "Label",
    description: "Names the field. Also used to name the list of times.",
    group: "Content",
    type: "text",
    default: "Start time",
    maxLength: 60,
  },
  {
    key: "hint",
    label: "Hint",
    description: "Under the label. Leave empty to drop it.",
    group: "Content",
    type: "text",
    default: "Type a time, or pick one from the list.",
    maxLength: 160,
  },
  {
    key: "format",
    label: "Clock",
    description: "24-hour (14:30) or 12-hour (2:30 pm). Either way, both can be typed.",
    group: "Behaviour",
    type: "select",
    default: "24h",
    options: ["24h", "12h"],
  },
  {
    key: "interval",
    label: "Minutes between listed times",
    description: "Only changes the list. Any time in range can still be typed.",
    group: "Behaviour",
    type: "select",
    default: "30",
    options: ["5", "10", "15", "30", "60"],
  },
  {
    key: "earliest",
    label: "Earliest time",
    description: "24-hour, like 08:00. Earlier times are refused with a message.",
    group: "Behaviour",
    type: "text",
    default: "08:00",
    maxLength: 5,
  },
  {
    key: "latest",
    label: "Latest time",
    description: "24-hour, like 18:00.",
    group: "Behaviour",
    type: "text",
    default: "18:00",
    maxLength: 5,
  },
  {
    key: "startValue",
    label: "Starting time",
    description: "24-hour. Leave empty to start blank.",
    group: "Behaviour",
    type: "text",
    default: "",
    maxLength: 5,
  },
  {
    key: "name",
    label: "Form field name",
    description: "Submits the time as HH:MM (24-hour) under this name. Leave empty to leave it out.",
    group: "Add-ons",
    type: "text",
    default: "start-time",
    maxLength: 40,
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
    description: "The highlighted time in the list and the focus ring.",
    group: "Style",
    type: "color",
    default: "#2563eb",
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof timePickerSchema>, TimePickerConfig> = true;
