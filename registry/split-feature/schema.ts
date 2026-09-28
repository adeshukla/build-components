import type { ConfigOf, Schema } from "@/lib/schema";
import type { SplitFeatureConfig } from "./react/split-feature";

export const splitFeatureSchema = [
  { key: "heading", label: "Heading", group: "Content", type: "text", default: "Test the file you are going to ship", maxLength: 120 },
  { key: "headingLevel", label: "Heading level", group: "Content", type: "select", default: "h2", options: ["h2", "h3"] },
  { key: "body", label: "Body", group: "Content", type: "text", default: "The preview runs the exported code, not a mock-up of it. Change an option and the thing you will copy changes with it.", maxLength: 300 },
  {
    key: "points",
    label: "Points",
    group: "Content",
    type: "list",
    default: [
      { text: "The same tests run on the React file and the plain HTML, CSS and JavaScript." },
      { text: "Keyboard paths and axe checks, with the component open and closed." },
      { text: "Chromium, WebKit and an emulated iPhone, every time." },
    ],
    fields: [{ key: "text", label: "Point", maxLength: 160 }],
    maxItems: 8,
    itemLabel: "Point",
  },
  { key: "linkLabel", label: "Link text", description: "Leave it empty for none.", group: "Content", type: "text", default: "See how it is tested", maxLength: 60 },
  { key: "linkHref", label: "Link goes to", group: "Content", type: "text", format: "url", default: "https://build-components.devstash.me/accessibility", maxLength: 300 },
  { key: "mediaSide", label: "Picture on the", description: "Only the column changes: the words stay first in the source either way.", group: "Style", type: "select", default: "right", options: ["left", "right"] },
  { key: "mediaSrc", label: "Picture URL", description: "Empty draws a panel instead. No image ships with this part.", group: "Content", type: "text", format: "url", default: "", maxLength: 300 },
  { key: "mediaAlt", label: "Picture description", description: "Leave it empty when the picture is decoration.", group: "Content", type: "text", default: "", maxLength: 200 },
  { key: "aspect", label: "Picture shape", group: "Style", type: "select", default: "4-3", options: ["4-3", "1-1", "16-9"] },
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
export const schemaMatchesComponent: Same<ConfigOf<typeof splitFeatureSchema>, SplitFeatureConfig> = true;
