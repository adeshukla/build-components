import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Reach the stars. The group takes one Tab stop, like any set of radio buttons."],
  [["← →", "↑ ↓"], "Move between the stars, which also picks."],
];

export const checklist = [
  "Screen reader, picking: each star reads as “3 stars, 3 of 5” — a radio group, not five buttons.",
  "Screen reader, showing: the whole rating is read once, e.g. “4.2 out of 5”, not star by star.",
  "The rating is shown as a number as well as by the stars, so it doesn't depend on colour or shape.",
  "Windows High Contrast / forced colours: filled and empty stars still look different.",
  "Each star is at least 24px, including its padding, on a phone.",
  "Don't include a count of ratings unless you really have one.",
];
