import type { ConfigOf, Schema } from "@/lib/schema";
import type { VideoEmbedConfig } from "./react/video-embed";

export const videoEmbedSchema = [
  { key: "title", label: "Video title", description: "Becomes the frame's title and part of the play button's name.", group: "Content", type: "text", default: "Building an accessible date picker, start to finish", maxLength: 160 },
  { key: "embedUrl", label: "Embed address", description: "The host's embed URL. Empty is honest: nothing is invented, and pressing play says what is missing.", group: "Content", type: "text", format: "url", default: "", maxLength: 300 },
  { key: "watchUrl", label: "Watch-it-there address", description: "A direct link, so the video is reachable where the frame is blocked. Empty for none.", group: "Content", type: "text", format: "url", default: "", maxLength: 300 },
  { key: "providerName", label: "Host name", description: "Used in \"Watch on …\".", group: "Content", type: "text", default: "the video host", maxLength: 40 },
  { key: "posterSrc", label: "Poster image", description: "Empty draws a placeholder instead. No image ships with this part.", group: "Content", type: "text", format: "url", default: "", maxLength: 300 },
  { key: "playLabel", label: "Play button verb", description: "The title is added to it, so the name is never just \"Play\".", group: "Content", type: "text", default: "Play", maxLength: 30 },
  { key: "durationText", label: "How long", description: "Empty hides it.", group: "Content", type: "text", default: "24 minutes", maxLength: 40 },
  { key: "privacyNote", label: "Note before playing", description: "Empty for none. It disappears once the video is asked for.", group: "Content", type: "text", default: "Nothing is requested from the video host until you press play.", maxLength: 200 },
  { key: "aspect", label: "Shape", group: "Style", type: "select", default: "16-9", options: ["16-9", "4-3", "1-1"] },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or follow the device.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#b42318" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof videoEmbedSchema>, VideoEmbedConfig> = true;
