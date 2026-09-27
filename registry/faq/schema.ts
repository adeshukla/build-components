import type { ConfigOf, Schema } from "@/lib/schema";
import type { FaqConfig } from "./react/faq";

export const faqSchema = [
  { key: "heading", label: "Heading", group: "Content", type: "text", default: "Questions", maxLength: 60 },
  { key: "intro", label: "Intro", description: "Leave it empty for none.", group: "Content", type: "text", default: "If yours is not here, write to us and we will add it.", maxLength: 160 },
  {
    key: "items",
    label: "Questions",
    group: "Content",
    type: "list",
    default: [
      {
        question: "Do I need to install anything?",
        answer: "No. You copy the files into your project, or install them by URL through the registry. There is no package to add and nothing to keep updated.",
      },
      {
        question: "Which Tailwind version does the React output need?",
        answer: "Tailwind v4. The exported file uses v4-only syntax for custom properties, so v3 will not style it correctly.",
      },
      {
        question: "Can I change the code afterwards?",
        answer: "That is the point. Once the files are in your project they are yours: rename things, delete the options you do not use, fold them into your own components.",
      },
      {
        question: "What about dark mode?",
        answer: "Every part has a theme option: light, dark, or following the visitor's device. The dark colours are part of the exported file, not a separate stylesheet.",
      },
    ],
    fields: [
      { key: "question", label: "Question", maxLength: 120 },
      { key: "answer", label: "Answer", maxLength: 400 },
    ],
    maxItems: 30,
    itemLabel: "Question",
  },
  { key: "showToggleAll", label: "Open all button", group: "Add-ons", type: "boolean", default: true },
  { key: "openFirst", label: "First answer open", description: "Useful when one answer is the one everybody wants.", group: "Behaviour", type: "boolean", default: false },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", description: "Focus rings.", group: "Style", type: "color", default: "#1d4ed8" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof faqSchema>, FaqConfig> = true;
