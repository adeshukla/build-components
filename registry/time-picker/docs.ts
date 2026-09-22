import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["↓", "↑"], "Open the list, then move through the times. The list opens at the chosen time."],
  [["Enter"], "Pick the highlighted time."],
  [["Escape"], "Close the list and keep what is typed."],
  [["Tab"], "Leave the field. What was typed is read as a time, or explained if it can't be."],
];

export const checklist = [
  "Screen reader: the field reads its label, the clock format with an example, and the hint.",
  "Moving through the list reads each time; the chosen one is announced as selected.",
  "Typing a time that isn't in the list (e.g. 09:47) is kept, not thrown away.",
  "A time outside the allowed hours says which hours are allowed, and the field is marked invalid.",
  "Typing 2pm, 14, 1430 and 2:30 pm all end up as the time you meant.",
  "Phone width: the list stays inside the screen and each time is easy to tap.",
  "On a real iPhone in Safari: the keyboard does not cover the list.",
];
