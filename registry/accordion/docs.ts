import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab", "Shift + Tab"], "Move between section buttons, and into an open section."],
  [["Enter", "Space"], "Open or close the focused section."],
];

export const checklist = [
  "Screen reader: each button is announced as collapsed or expanded, inside a heading of the level you chose.",
  "The heading level fits the page: an accordion inside a section under an H2 usually wants H3 buttons.",
  "With several open at once switched off, opening one section closes the last one without moving the page under you.",
  "Browser zoom at 200%: long section titles wrap instead of pushing the icon off the edge.",
  "Windows High Contrast / forced colours: the open section is still obvious.",
  "On a real iPhone in Safari: the whole row is tappable, not just the words.",
];
