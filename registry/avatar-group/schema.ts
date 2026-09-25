import type { ConfigOf, Schema } from "@/lib/schema";
import type { AvatarGroupConfig } from "./react/avatar-group";

export const avatarGroupSchema = [
  {
    key: "label",
    label: "Group name",
    description: "What this set of people is, e.g. “On this project”. Read before the names.",
    group: "Content",
    type: "text",
    default: "On this project",
    maxLength: 60,
  },
  {
    key: "people",
    label: "People",
    description: "A picture address is optional; without one, the initials are drawn instead.",
    group: "Content",
    type: "list",
    default: [
      { name: "Ada Okafor", src: "" },
      { name: "Bruno Lind", src: "" },
      { name: "Cerys Nolan", src: "" },
      { name: "Dara Whitfield", src: "" },
      { name: "Elin Marsh", src: "" },
    ],
    fields: [
      { key: "name", label: "Name", maxLength: 60 },
      { key: "src", label: "Picture", maxLength: 300, format: "url" },
    ],
    maxItems: 20,
    itemLabel: "Person",
  },
  {
    key: "max",
    label: "Show at most",
    description: "The rest are counted in a “+3” circle that names them.",
    group: "Behaviour",
    type: "number",
    default: 4,
    min: 1,
    max: 8,
  },
  { key: "size", label: "Size", group: "Style", type: "select", default: "md", options: ["sm", "md", "lg"] },
  { key: "overlap", label: "Overlap", description: "Circles tucked under each other, or spaced apart.", group: "Style", type: "boolean", default: true },
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
export const schemaMatchesComponent: Same<ConfigOf<typeof avatarGroupSchema>, AvatarGroupConfig> = true;
