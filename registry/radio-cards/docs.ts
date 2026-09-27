import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "One stop for the whole group, then past it."],
  [["← → ↑ ↓"], "Move through the cards, skipping any that are off."],
  [["Space"], "Pick the card you are on."],
];

export const checklist = [
  "The card is paint around a real radio: one tab stop, arrow keys, and the form submits it without any script.",
  "The fieldset's legend asks the question, so each card is announced as an answer to it.",
  "The whole card is the label, so tapping anywhere in it picks that option — a 44px target at least.",
  "Options that are off are disabled and say “Not available”, rather than being only dashed.",
  "The tick repeats what the border colour shows, and the choice is said in a status line.",
  "Nothing here needs JavaScript to work; the script only writes the status line.",
];
