import type { ConfigOf, Schema } from "@/lib/schema";
import type { TimeRangeConfig } from "./react/time-range";

export const timeRangeSchema = [
  { key: "legend", label: "Question", group: "Content", type: "text", default: "When are you open?", maxLength: 80 },
  { key: "hint", label: "Hint", description: "Leave it empty for none.", group: "Content", type: "text", default: "Use the 24-hour clock or your device's own time picker.", maxLength: 140 },
  { key: "fromLabel", label: "First field", group: "Content", type: "text", default: "Opens", maxLength: 40 },
  { key: "toLabel", label: "Second field", group: "Content", type: "text", default: "Closes", maxLength: 40 },
  { key: "name", label: "Field name", description: "The two fields send this with From and To on the end.", group: "Behaviour", type: "text", default: "hours", maxLength: 40 },
  { key: "earliest", label: "Earliest time", description: "As 06:00. Leave it empty for no limit.", group: "Behaviour", type: "text", default: "06:00", maxLength: 5 },
  { key: "latest", label: "Latest time", description: "As 23:30. Leave it empty for no limit.", group: "Behaviour", type: "text", default: "23:30", maxLength: 5 },
  { key: "stepMinutes", label: "Step (minutes)", description: "What the arrow keys move by.", group: "Behaviour", type: "number", default: 30, min: 1, max: 120 },
  { key: "required", label: "Both required", group: "Behaviour", type: "boolean", default: false },
  { key: "allowOvernight", label: "Allow an overnight span", description: "22:00 to 02:00 becomes four hours instead of an error.", group: "Behaviour", type: "boolean", default: false },
  { key: "orderErrorText", label: "Out-of-order message", group: "Behaviour", type: "text", default: "Closing time must be after opening time.", maxLength: 120 },
  { key: "showLength", label: "Say how long it is", group: "Add-ons", type: "boolean", default: true },
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
  {
    key: "hourOneText",
    label: "One hour",
    description: "Spoken length.",
    group: "Words",
    type: "text",
    default: "{count} hour",
    maxLength: 160,
  },
  {
    key: "hoursText",
    label: "Several hours",
    description: "Spoken length.",
    group: "Words",
    type: "text",
    default: "{count} hours",
    maxLength: 160,
  },
  {
    key: "minuteOneText",
    label: "One minute",
    description: "Spoken length.",
    group: "Words",
    type: "text",
    default: "{count} minute",
    maxLength: 160,
  },
  {
    key: "minutesText",
    label: "Several minutes",
    description: "Spoken length.",
    group: "Words",
    type: "text",
    default: "{count} minutes",
    maxLength: 160,
  },
  {
    key: "noTimeText",
    label: "No time",
    description: "When start and end are the same.",
    group: "Words",
    type: "text",
    default: "no time at all",
    maxLength: 160,
  },
  {
    key: "nextDayText",
    label: "Ends the next day",
    description: "{length} is the spoken length.",
    group: "Words",
    type: "text",
    default: "{length}, finishing the next day",
    maxLength: 160,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof timeRangeSchema>, TimeRangeConfig> = true;
