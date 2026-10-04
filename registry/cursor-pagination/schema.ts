import type { ConfigOf, Schema } from "@/lib/schema";
import type { CursorPaginationConfig } from "./react/cursor-pagination";

export const cursorPaginationSchema = [
  { key: "heading", label: "List heading", description: "Focus lands here after each page, so it has to say what the list is.", group: "Content", type: "text", default: "Build log", maxLength: 60 },
  { key: "label", label: "Nav name", group: "Content", type: "text", default: "Results", maxLength: 40 },
  { key: "itemNoun", label: "One row is a", description: "Used in the range line and the stand-in rows.", group: "Content", type: "text", default: "entry", maxLength: 30 },
  { key: "previousLabel", label: "Back button", description: "Newer and Older beat Previous and Next for a list ordered by time.", group: "Content", type: "text", default: "Newer", maxLength: 30 },
  { key: "nextLabel", label: "Forward button", group: "Content", type: "text", default: "Older", maxLength: 30 },
  { key: "pageSize", label: "Rows per page", group: "Behaviour", type: "number", default: 5, min: 1, max: 50 },
  { key: "totalItems", label: "Rows in the stand-in list", description: "Only the demo data. Your own request decides where the list ends.", group: "Behaviour", type: "number", default: 23, min: 1, max: 500 },
  { key: "knowsTotal", label: "The total is known", description: "Off is the honest default for a cursor: it finds the end by getting a short page.", group: "Behaviour", type: "boolean", default: false },
  { key: "atStartText", label: "At the first page", group: "Content", type: "text", default: "You are on the newest page.", maxLength: 100 },
  { key: "atEndText", label: "At the last page", group: "Content", type: "text", default: "You have reached the end.", maxLength: 100 },
  { key: "showRange", label: "Say which rows these are", group: "Add-ons", type: "boolean", default: true },
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
  {
    key: "showingText",
    label: "Showing",
    description: "Said for the page shown. {item} is the noun, {range} the numbers.",
    group: "Words",
    type: "text",
    default: "Showing {item} {range}",
    maxLength: 80,
  },
  {
    key: "showingTotalText",
    label: "Showing, with a total",
    description: "Said when the total is known. {item}, {range} and {total} are filled in.",
    group: "Words",
    type: "text",
    default: "Showing {item} {range} of {total}",
    maxLength: 80,
  },
  {
    key: "rangeText",
    label: "Range",
    description: "The numbers shown. {start} and {end} are filled in.",
    group: "Words",
    type: "text",
    default: "{start} to {end}",
    maxLength: 40,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof cursorPaginationSchema>, CursorPaginationConfig> = true;
