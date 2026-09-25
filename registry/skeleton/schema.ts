import type { ConfigOf, Schema } from "@/lib/schema";
import type { SkeletonConfig } from "./react/skeleton";

export const skeletonSchema = [
  {
    key: "variant",
    label: "Shape",
    description: "A block of lines, a list of rows, or cards with a picture area.",
    group: "Behaviour",
    type: "select",
    default: "list",
    options: ["lines", "card", "list"],
  },
  { key: "rows", label: "Rows", description: "For a list or cards.", group: "Behaviour", type: "number", default: 3, min: 1, max: 8 },
  { key: "lines", label: "Lines per row", group: "Behaviour", type: "number", default: 2, min: 1, max: 8 },
  { key: "showAvatar", label: "Avatar circle", group: "Add-ons", type: "boolean", default: true },
  {
    key: "animate",
    label: "Sheen",
    description: "A slow shimmer. It stops by itself when the visitor asks for less motion.",
    group: "Style",
    type: "boolean",
    default: true,
  },
  {
    key: "loadingText",
    label: "What is loading",
    description: "Said once by a screen reader, e.g. “Loading comments”. Say what, not just “Loading”.",
    group: "Content",
    type: "text",
    default: "Loading comments",
    maxLength: 60,
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
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof skeletonSchema>, SkeletonConfig> = true;
