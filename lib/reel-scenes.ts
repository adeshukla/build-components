/*
 * The scenes of the home page reel (D79): real parts, played in a frame by a script. Shared by the frame
 * (components/motion-reel.tsx), which plays them, and the hero (components/hero-reel.tsx), which names them
 * and falls back to a still of each (public/reels/<slug>.jpg) when motion is reduced.
 */
export const reelScenes = [
  { slug: "searchable-select", title: "Searchable select", line: "Type to filter, arrows to choose" },
  { slug: "date-picker", title: "Date picker", line: "A calendar that closes on a choice" },
  { slug: "kanban", title: "Kanban board", line: "Cards move by button as well as by drag" },
  { slug: "otp", title: "OTP input", line: "A code typed one digit at a time" },
  { slug: "toast", title: "Toast notifications", line: "Messages that stack and clear themselves" },
  { slug: "command-menu", title: "Command menu", line: "Ctrl K, then arrows" },
] as const;

/** The frame's own size: the parent scales it to fit and moves its camera over it. */
export const REEL_WIDTH = 1280;
export const REEL_HEIGHT = 800;

export type ReelMessage =
  | { type: "reel-scene"; index: number }
  | { type: "reel-key"; label: string | null }
  | { type: "reel-camera"; x: number; y: number; width: number; height: number; zoom: number; duration: number };
