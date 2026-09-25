import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Reach the typed name field, Clear and Confirm. The drawing area is not a keyboard control."],
  [["Enter", "Space"], "Clear the pad, or confirm what is there."],
];

export const checklist = [
  "Typing the name is a real alternative, not a fallback: a canvas cannot be drawn on with a keyboard, which would otherwise fail WCAG 2.1.1.",
  "The canvas is an img with a label and a description, so it is not an unnamed blank to a screen reader.",
  "Whether anything has been signed is said in words, because the ink itself cannot be read out.",
  "Confirm is really disabled until there is something to confirm.",
  "The stroke is drawn in the theme's ink colour, so a dark page does not get a signature in black on near-black.",
  "touch-action is none on the canvas, so drawing on a phone does not scroll the page.",
  "Clear says it cleared: a silently emptied box leaves people wondering.",
];
