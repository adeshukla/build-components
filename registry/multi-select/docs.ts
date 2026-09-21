import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["↓ ↑"], "Open the list and move through the options. The caret stays in the box."],
  [["Enter"], "Add or remove the highlighted option."],
  [["Backspace"], "With an empty box, take the last choice off."],
  [["Esc"], "Close the list and leave the choices alone."],
  [["Tab"], "Leave the field. The chosen ones are buttons you can reach too."],
];

export const checklist = [
  "Screen reader: the box is announced as a combobox, and the list as allowing several choices.",
  "Moving with the arrows announces each option and whether it is already chosen.",
  "Choosing and removing are both announced, with how many are chosen now.",
  "How many options match what you typed is announced, so nobody types into silence.",
  "Every chosen item can be taken off with the keyboard alone, and its button names it.",
  "At the limit, the options left say so rather than failing silently.",
  "On a real iPhone in Safari: the list scrolls and the keyboard does not cover the choices.",
];
