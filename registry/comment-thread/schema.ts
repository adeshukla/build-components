import type { ConfigOf, Schema } from "@/lib/schema";
import type { CommentThreadConfig } from "./react/comment-thread";

export const commentThreadSchema = [
  { key: "heading", label: "Heading", group: "Content", type: "text", default: "Comments", maxLength: 40 },
  {
    key: "comments",
    label: "Comments",
    description: "Set reply to yes for a comment that answers the one above it.",
    group: "Content",
    type: "list",
    default: [
      { author: "Priya", when: "4 March, 9:12", body: "The hull drawings are a revision behind — worth a check before Friday.", reply: "no" },
      { author: "Sam", when: "4 March, 9:40", body: "Good spot. I have asked the yard for the current set.", reply: "yes" },
      { author: "Marta", when: "4 March, 11:02", body: "Do we need the survey signed before the refit starts?", reply: "no" },
    ],
    fields: [
      { key: "author", label: "Author", maxLength: 40 },
      { key: "when", label: "When", maxLength: 40 },
      { key: "body", label: "Comment", maxLength: 300 },
      { key: "reply", label: "Reply? yes / no", maxLength: 3 },
    ],
    maxItems: 30,
    itemLabel: "Comment",
  },
  { key: "allowReply", label: "Comment box", group: "Add-ons", type: "boolean", default: true },
  { key: "replyLabel", label: "Box label", group: "Content", type: "text", default: "Add a comment", maxLength: 40 },
  { key: "postText", label: "Post button", group: "Content", type: "text", default: "Post", maxLength: 20 },
  { key: "yourName", label: "Your name", description: "Shown on comments added here.", group: "Content", type: "text", default: "You", maxLength: 40 },
  { key: "collapsible", label: "Hide the thread button", group: "Add-ons", type: "boolean", default: true },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#1d4ed8" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof commentThreadSchema>, CommentThreadConfig> = true;
