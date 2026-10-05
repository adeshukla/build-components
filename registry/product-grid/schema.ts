import type { ConfigOf, Schema } from "@/lib/schema";
import type { ProductGridConfig } from "./react/product-grid";

export const productGridSchema = [
  { key: "heading", label: "Heading", group: "Content", type: "text", default: "New in", maxLength: 120 },
  { key: "headingLevel", label: "Heading level", description: "Each product's name sits one level under it.", group: "Content", type: "select", default: "h2", options: ["h2", "h3"] },
  { key: "intro", label: "Intro", description: "Leave it empty for none.", group: "Content", type: "text", default: "", maxLength: 300 },
  {
    key: "products",
    label: "Products",
    description: "No pictures ship with this part: set each picture's address, and describe it in its alt text. A product with no name is not shown.",
    group: "Content",
    type: "list",
    default: [
      { name: "Deck jacket", price: "£128", href: "/shop/deck-jacket", image: "", alt: "", note: "New" },
      { name: "Harbour jumper", price: "£86", href: "/shop/harbour-jumper", image: "", alt: "", note: "" },
      { name: "Canvas tote", price: "£34", href: "/shop/canvas-tote", image: "", alt: "", note: "" },
      { name: "Wool beanie", price: "£22", href: "/shop/wool-beanie", image: "", alt: "", note: "Last few" },
    ],
    fields: [
      { key: "name", label: "Name", maxLength: 80 },
      { key: "price", label: "Price, as written", maxLength: 30 },
      { key: "href", label: "Link", maxLength: 300, format: "url" },
      { key: "image", label: "Picture address", maxLength: 500, format: "url" },
      { key: "alt", label: "Picture description", maxLength: 160 },
      { key: "note", label: "Note (New, Sale…)", maxLength: 24 },
    ],
    maxItems: 24,
    itemLabel: "Product",
  },
  { key: "columns", label: "Columns on a wide screen", group: "Style", type: "select", default: "4", options: ["2", "3", "4"] },
  { key: "shape", label: "Picture shape", group: "Style", type: "select", default: "square", options: ["square", "portrait", "landscape"] },
  { key: "theme", label: "Theme", group: "Style", type: "select", default: "light", options: ["light", "dark", "system"] },
  { key: "accentColor", label: "Accent colour", description: "Names as they are pointed at, notes and focus rings.", group: "Style", type: "color", default: "#16303f" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof productGridSchema>, ProductGridConfig> = true;
