import type { ConfigOf, Schema } from "@/lib/schema";
import type { DateRangeConfig } from "./react/date-range";

export const dateRangeSchema = [
  { key: "legend", label: "Question", group: "Content", type: "text", default: "When are you staying?", maxLength: 80 },
  { key: "hint", label: "Hint", description: "Leave it empty for none.", group: "Content", type: "text", default: "Check-in is from 3pm, check-out by 11am.", maxLength: 140 },
  { key: "fromLabel", label: "First field", group: "Content", type: "text", default: "Check in", maxLength: 40 },
  { key: "toLabel", label: "Second field", group: "Content", type: "text", default: "Check out", maxLength: 40 },
  { key: "name", label: "Field name", description: "The two fields send this with From and To on the end.", group: "Behaviour", type: "text", default: "stay", maxLength: 40 },
  { key: "min", label: "Earliest date", description: "As 2026-03-04. Leave it empty for no limit.", group: "Behaviour", type: "text", default: "", maxLength: 10 },
  { key: "max", label: "Latest date", description: "As 2026-12-31. Leave it empty for no limit.", group: "Behaviour", type: "text", default: "", maxLength: 10 },
  { key: "required", label: "Both required", group: "Behaviour", type: "boolean", default: false },
  { key: "orderErrorText", label: "Out-of-order message", group: "Behaviour", type: "text", default: "Check-out cannot be before check-in.", maxLength: 120 },
  { key: "showSpan", label: "Say the span", group: "Add-ons", type: "boolean", default: true },
  { key: "spanUnit", label: "Count", description: "Nights counts the gap; days counts both ends.", group: "Add-ons", type: "select", default: "nights", options: ["nights", "days"] },
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
    key: "monthNames",
    label: "Month names",
    description: "The twelve months, January first, with commas between.",
    group: "Words",
    type: "text",
    default: "January,February,March,April,May,June,July,August,September,October,November,December",
    maxLength: 240,
  },
  {
    key: "dateText",
    label: "Date",
    description: "How a date is written. {day}, {month} and {year} are filled in.",
    group: "Words",
    type: "text",
    default: "{day} {month} {year}",
    maxLength: 40,
  },
  {
    key: "nightOne",
    label: "One night",
    description: "{count} is 1.",
    group: "Words",
    type: "text",
    default: "{count} night",
    maxLength: 30,
  },
  {
    key: "nightMany",
    label: "Nights",
    description: "{count} is the number.",
    group: "Words",
    type: "text",
    default: "{count} nights",
    maxLength: 30,
  },
  {
    key: "dayOne",
    label: "One day",
    description: "{count} is 1.",
    group: "Words",
    type: "text",
    default: "{count} day",
    maxLength: 30,
  },
  {
    key: "dayMany",
    label: "Days",
    description: "{count} is the number.",
    group: "Words",
    type: "text",
    default: "{count} days",
    maxLength: 30,
  },
  {
    key: "spanText",
    label: "Span",
    description: "Said once both dates are in. {span}, {from} and {to} are filled in.",
    group: "Words",
    type: "text",
    default: "{span}, {from} to {to}",
    maxLength: 80,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof dateRangeSchema>, DateRangeConfig> = true;
