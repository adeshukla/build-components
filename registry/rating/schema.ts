import type { ConfigOf, Schema } from "@/lib/schema";
import type { RatingConfig } from "./react/rating";

export const ratingSchema = [
  {
    key: "label",
    label: "Label",
    description: "Names the group when someone is picking a rating.",
    group: "Content",
    type: "text",
    default: "Rate this part",
    maxLength: 80,
  },
  {
    key: "mode",
    label: "Kind",
    description: "Pick a rating, or show one that has already been given.",
    group: "Behaviour",
    type: "select",
    default: "pick",
    options: ["pick", "show"],
  },
  { key: "max", label: "Stars", group: "Behaviour", type: "number", default: 5, min: 2, max: 10 },
  {
    key: "value",
    label: "Value",
    description: "The starting choice, or the average to show. Averages can have a decimal.",
    group: "Behaviour",
    type: "number",
    default: 4,
    min: 0,
    max: 10,
    step: 0.1,
  },
  {
    key: "showValue",
    label: "Show the number",
    description: "In words beside the stars, so the rating isn't shown by shape alone.",
    group: "Add-ons",
    type: "boolean",
    default: true,
  },
  {
    key: "countText",
    label: "Extra note",
    description: "Free text beside the stars, e.g. how many ratings. Leave empty to drop it.",
    group: "Content",
    type: "text",
    default: "",
    maxLength: 60,
  },
  {
    key: "name",
    label: "Form field name",
    description: "For picking. Submits the number of stars.",
    group: "Add-ons",
    type: "text",
    default: "rating",
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
  { key: "accentColor", label: "Star colour", group: "Style", type: "color", default: "#e6a700" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof ratingSchema>, RatingConfig> = true;
