import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Enter the group. It takes one Tab stop, like any set of radio buttons."],
  [["← →", "↑ ↓"], "Move between the choices, which also picks."],
];

export const checklist = [
  "Screen reader: reads the group label, then “List, 1 of 3” — a radio group, not three buttons.",
  "The picked segment is shown by more than colour (filled background and contrast).",
  "Windows High Contrast / forced colours: the picked segment is still obvious.",
  "Each segment is at least 24px tall, and the labels don't disappear on a narrow screen.",
  "Use it for a handful of choices that all fit; use tabs when each choice has its own panel.",
];
