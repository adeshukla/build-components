import type { ConfigOf, Schema } from "@/lib/schema";
import type { TreeViewConfig } from "./react/tree-view";

export const treeViewSchema = [
  {
    key: "label",
    label: "Name",
    description: "Names the tree for screen readers, and is shown above it.",
    group: "Content",
    type: "text",
    default: "Project files",
    maxLength: 60,
  },
  {
    key: "items",
    label: "Items",
    description: "One path per item, with / between levels. Folders are made from the paths, as deep as you like.",
    group: "Content",
    type: "list",
    default: [
      { path: "src/app/layout.tsx" },
      { path: "src/app/page.tsx" },
      { path: "src/app/settings/page.tsx" },
      { path: "src/components/button.tsx" },
      { path: "src/components/dialog.tsx" },
      { path: "src/lib/format.ts" },
      { path: "public/logo.svg" },
      { path: "package.json" },
      { path: "README.md" },
    ],
    fields: [{ key: "path", label: "Path", maxLength: 120 }],
    maxItems: 40,
    itemLabel: "Item",
  },
  {
    key: "startOpen",
    label: "Open at the start",
    description: "Which folders are open before anyone touches the tree.",
    group: "Behaviour",
    type: "select",
    default: "top",
    options: ["none", "top", "all"],
  },
  {
    key: "showIcons",
    label: "Folder and file icons",
    group: "Add-ons",
    type: "boolean",
    default: true,
  },
  {
    key: "showSelection",
    label: "Show what is selected",
    description: "A line under the tree with the selected item's full path, announced as it changes.",
    group: "Add-ons",
    type: "boolean",
    default: true,
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
    description: "The focus ring.",
    group: "Style",
    type: "color",
    default: "#2563eb",
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof treeViewSchema>, TreeViewConfig> = true;
