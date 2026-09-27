import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [[["Tab"], "Move between whichever features carry a link."]];

export const checklist = [
  "The features are a list, so a screen reader says how many there are before reading them.",
  "Each feature has a real heading, so they can be jumped between rather than read as one block of text.",
  "The glyphs are aria-hidden decoration: a dingbat read out as a character helps nobody.",
  "Every link names its feature, so a list of links is not six identical Read mores.",
  "The section is labelled by its heading, which makes it a landmark worth skipping to.",
  "No icon font and no image requests: the glyph is text you can change to your own icon component.",
];
