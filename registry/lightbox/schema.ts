import type { ConfigOf, Schema } from "@/lib/schema";
import type { LightboxConfig } from "./react/lightbox";

export const lightboxSchema = [
  {
    key: "label",
    label: "Gallery name",
    description: "Shown above the grid and used to name the viewer.",
    group: "Content",
    type: "text",
    default: "Gallery",
    maxLength: 60,
  },
  {
    key: "items",
    label: "Pictures",
    description:
      "Image address (a path on your site or https://), the description a screen reader reads, and a caption. With no image, a drawn placeholder is shown.",
    group: "Content",
    type: "list",
    default: [
      { src: "", alt: "Harbour at dawn", caption: "The harbour just after sunrise." },
      { src: "", alt: "Boats at the pier", caption: "Fishing boats tied up at the pier." },
      { src: "", alt: "Lighthouse on the cliff", caption: "The lighthouse on the north cliff." },
      { src: "", alt: "Market by the water", caption: "The Saturday market by the water." },
      { src: "", alt: "Storm over the bay", caption: "A storm rolling in over the bay." },
      { src: "", alt: "Evening on the beach", caption: "The beach on a still evening." },
    ],
    fields: [
      { key: "src", label: "Image", maxLength: 300, format: "url" },
      { key: "alt", label: "Description", maxLength: 120 },
      { key: "caption", label: "Caption", maxLength: 160 },
    ],
    maxItems: 24,
    itemLabel: "Picture",
  },
  {
    key: "columns",
    label: "Columns",
    description: "On wider screens. Phones always show two.",
    group: "Style",
    type: "select",
    default: "3",
    options: ["2", "3", "4"],
  },
  { key: "showCaptions", label: "Captions in the viewer", group: "Add-ons", type: "boolean", default: true },
  {
    key: "loop",
    label: "Loop",
    description: "After the last picture, Next goes back to the first.",
    group: "Behaviour",
    type: "boolean",
    default: true,
  },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to. The viewer is always dark.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  {
    key: "accentColor",
    label: "Accent colour",
    description: "The focus ring on the thumbnails.",
    group: "Style",
    type: "color",
    default: "#2563eb",
  },
  {
    key: "viewerLabel",
    label: "Viewer",
    description: "Names the viewer. {label} is the gallery's name.",
    group: "Words",
    type: "text",
    default: "{label}, picture viewer",
    maxLength: 80,
  },
  {
    key: "closeLabel",
    label: "Close",
    description: "Read out for the ×.",
    group: "Words",
    type: "text",
    default: "Close",
    maxLength: 30,
  },
  {
    key: "previousLabel",
    label: "Previous",
    description: "Read out for the left arrow.",
    group: "Words",
    type: "text",
    default: "Previous picture",
    maxLength: 40,
  },
  {
    key: "nextLabel",
    label: "Next",
    description: "Read out for the right arrow.",
    group: "Words",
    type: "text",
    default: "Next picture",
    maxLength: 40,
  },
  {
    key: "counterText",
    label: "Counter",
    description: "Shown under the picture. {index} and {total} are numbers.",
    group: "Words",
    type: "text",
    default: "{index} of {total}",
    maxLength: 40,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof lightboxSchema>, LightboxConfig> = true;
