import type { ConfigOf, Schema } from "@/lib/schema";
import type { CodeBlockConfig } from "./react/code-block";

export const codeBlockSchema = [
  { key: "title", label: "File name", group: "Content", type: "text", default: "install.sh", maxLength: 60 },
  {
    key: "lines",
    label: "Lines",
    description: "One line of code each. An empty line stays empty.",
    group: "Content",
    type: "list",
    default: [
      { text: "# Copy the component into your project" },
      { text: "pnpm dlx shadcn@latest add https://build-components.devstash.me/r/tabs.json" },
      { text: "" },
      { text: "# Or take the file by hand and drop it in components/" },
      { text: "curl -O https://build-components.devstash.me/r/tabs.json" },
    ],
    fields: [{ key: "text", label: "Line", maxLength: 200 }],
    maxItems: 60,
    itemLabel: "Line",
  },
  { key: "showLineNumbers", label: "Line numbers", description: "Decoration only — they are never copied.", group: "Style", type: "boolean", default: true },
  { key: "wrapToggle", label: "Wrap lines button", group: "Add-ons", type: "boolean", default: true },
  { key: "copyText", label: "Copy button", group: "Content", type: "text", default: "Copy", maxLength: 20 },
  { key: "copiedText", label: "Copied message", group: "Content", type: "text", default: "Copied", maxLength: 40 },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to.",
    group: "Style",
    type: "select",
    default: "dark",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#0f766e" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof codeBlockSchema>, CodeBlockConfig> = true;
