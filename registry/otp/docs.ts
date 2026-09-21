import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["0–9"], "Fill the focused box and move on to the next."],
  [["Backspace"], "Clear the box, or step back and clear the one before."],
  [["← →"], "Move between boxes without changing them."],
  [["Ctrl + V", "Cmd + V"], "Paste the whole code: it fills the boxes from where you are."],
];

export const checklist = [
  "Screen reader: the group is announced with its label before the first box, not just “edit text”.",
  "Each box says which one it is, e.g. “Character 3 of 6”.",
  "Pasting a whole code fills every box, which is how most people enter one.",
  "Backspace on an empty box steps back, so a mistake takes one key to fix.",
  "The first box carries autocomplete=\"one-time-code\", so a phone offers the code from the message.",
  "Completing the code is announced without moving focus.",
  "There is a way to ask for another code: without one, a code that never arrives is a dead end.",
];
