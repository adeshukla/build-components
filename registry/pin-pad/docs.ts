import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["0", "–", "9"], "Type a digit straight in, wherever the focus is inside the pad."],
  [["Backspace"], "Remove the last digit."],
  [["Tab"], "Move across the pad's keys."],
  [["Space", "Enter"], "Press the key you are on."],
];

export const checklist = [
  "The pad is real buttons and the value lives in a hidden input, so the form sends one field and the browser never tries to autofill twelve.",
  "Typing works as well as tapping: a pad that only answers to a pointer locks out anyone on a keyboard.",
  "The count is announced — three of four digits entered — and the digits never are, because a live region is read aloud in the room.",
  "The dots are aria-hidden: they are a picture of the count the status line already gives.",
  "The order is fixed, phone or calculator. A shuffled pad defeats muscle memory and is far slower for anyone with a motor impairment.",
  "Every key is 56px tall, comfortably past the 44px a thumb needs.",
  "The delete key is named in words; ⌫ alone is not a name.",
];
