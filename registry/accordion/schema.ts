import type { ConfigOf, Schema } from "@/lib/schema";
import type { AccordionConfig } from "./react/accordion";

export const accordionSchema = [
  {
    key: "items",
    label: "Sections",
    description: "One row per section: the button text, and what it opens.",
    group: "Content",
    type: "list",
    default: [
      {
        title: "How do I install a part?",
        content:
          "Copy the file, or run the one install command shown under the editor. Either way the code lands in your project and belongs to you.",
      },
      {
        title: "Do I need a library?",
        content:
          "No. Every part is plain React and Tailwind, or plain HTML, CSS and JavaScript. Nothing is installed at runtime.",
      },
      {
        title: "Can I change it later?",
        content:
          "Yes. The options you set are a plain object at the top of the file, so you can edit them by hand whenever you like.",
      },
    ],
    fields: [
      { key: "title", label: "Section title", maxLength: 100 },
      { key: "content", label: "Section text", maxLength: 500 },
    ],
    maxItems: 12,
    itemLabel: "Section",
  },
  {
    key: "headingLevel",
    label: "Heading level",
    description: "Each button sits inside a heading. Pick the level that fits the page around it.",
    group: "Behaviour",
    type: "select",
    default: "h3",
    options: ["h2", "h3", "h4"],
  },
  {
    key: "allowMultiple",
    label: "Several open at once",
    description: "Off means opening one section closes the others.",
    group: "Behaviour",
    type: "boolean",
    default: false,
  },
  {
    key: "openFirst",
    label: "Start with the first open",
    description: "Shows the first section on load, so the area is never empty.",
    group: "Behaviour",
    type: "boolean",
    default: true,
  },
  {
    key: "icon",
    label: "Icon",
    description: "A chevron that turns, or a plus that becomes a cross.",
    group: "Add-ons",
    type: "select",
    default: "chevron",
    options: ["chevron", "plus"],
  },
  {
    key: "look",
    label: "Look",
    description: "One bordered block, separate cards, or plain rules between sections.",
    group: "Style",
    type: "select",
    default: "bordered",
    options: ["bordered", "separated", "plain"],
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
    description: "The icon and focus rings. Contrast-corrected before it is used as text.",
    group: "Style",
    type: "color",
    default: "#2563eb",
  },
  {
    key: "radius",
    label: "Corner radius (px)",
    description: "Roundness of the block or the cards.",
    group: "Style",
    type: "number",
    default: 10,
    min: 0,
    max: 24,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof accordionSchema>, AccordionConfig> = true;
