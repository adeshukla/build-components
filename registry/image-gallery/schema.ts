import type { ConfigOf, Schema } from "@/lib/schema";
import type { ImageGalleryConfig } from "./react/image-gallery";

export const imageGallerySchema = [
  { key: "heading", label: "Heading", group: "Content", type: "text", default: "Workshop, September", maxLength: 80 },
  {
    key: "items",
    label: "Pictures",
    description: "No images ship with this part: set each src. Leave alt empty for a decorative picture — that is not the same as leaving it out.",
    group: "Content",
    type: "list",
    default: [
      { src: "", alt: "A bench covered in stripped-down keyboards, mid-repair.", caption: "Twelve keyboards, four working." },
      { src: "", alt: "", caption: "The parts drawer, finally labelled." },
      { src: "", alt: "A whiteboard of arrows between six boxes, none of them labelled.", caption: "The plan, such as it was." },
      { src: "", alt: "", caption: "Solder station at the end of a long day." },
    ],
    fields: [
      { key: "src", label: "Image URL", maxLength: 300 },
      { key: "alt", label: "Alt text", maxLength: 200 },
      { key: "caption", label: "Caption", maxLength: 160 },
    ],
    maxItems: 24,
    itemLabel: "Picture",
  },
  { key: "columns", label: "Columns", group: "Style", type: "number", default: 2, min: 1, max: 6 },
  { key: "aspect", label: "Shape", description: "Set in CSS, so the space is reserved before the file arrives.", group: "Style", type: "select", default: "4-3", options: ["4-3", "1-1", "16-9"] },
  { key: "showCaptions", label: "Show captions", group: "Add-ons", type: "boolean", default: true },
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
export const schemaMatchesComponent: Same<ConfigOf<typeof imageGallerySchema>, ImageGalleryConfig> = true;
