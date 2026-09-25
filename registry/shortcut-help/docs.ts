import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["?"], "Open the list from anywhere on the page."],
  [["Tab"], "Reach the close button; focus stays inside."],
  [["Escape"], "Close, with focus back where it was."],
];

export const checklist = [
  "The single-key shortcut is ignored while someone is typing in a field, so ? in a message stays a question mark.",
  "It ignores Ctrl, Cmd and Alt combinations, so it never steals a browser shortcut.",
  "There is a visible button as well: WCAG 2.1.4 wants a way to turn a character shortcut off or reach it another way.",
  "The list is a description list — keys as the term, what they do as the description — not a table of divs.",
  "Focus goes to the close button on open and back to where it came from on close.",
  "Keys are real kbd elements, so they are read as keys rather than as stray letters.",
];
