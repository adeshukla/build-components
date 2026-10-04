import type { ConfigOf, Schema } from "@/lib/schema";
import type { PictureSectionConfig } from "./react/picture-section";

export const pictureSectionSchema = [
  { key: "imageSrc", label: "Picture", description: "Its address. Empty draws a placeholder: no image ships with this part.", group: "Content", type: "text", format: "url", default: "", maxLength: 300 },
  { key: "alt", label: "What it shows", description: "For anyone who cannot see it. Leave it empty only when the picture is decoration.", group: "Content", type: "text", default: "The team planning the week around one shared board", maxLength: 200 },
  { key: "caption", label: "Caption", description: "Shown under the picture. Leave it empty for none.", group: "Content", type: "text", default: "", maxLength: 200 },
  { key: "shape", label: "Shape", group: "Style", type: "select", default: "16-9", options: ["16-9", "4-3", "21-9", "1-1"] },
  { key: "frame", label: "Rounded with a hairline", group: "Style", type: "boolean", default: true },
  { key: "theme", label: "Theme", group: "Style", type: "select", default: "light", options: ["light", "dark", "system"] },
  {
    key: "placeholderLabel",
    label: "Before a picture is set",
    description: "Read out on the empty frame when there is no alt text.",
    group: "Words",
    type: "text",
    default: "Picture to come",
    maxLength: 160,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof pictureSectionSchema>, PictureSectionConfig> = true;
