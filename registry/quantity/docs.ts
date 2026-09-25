import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["↑ ↓"], "In the field: step the number up or down."],
  [["Tab"], "Move between the minus button, the field and the plus button."],
  [["0–9"], "Type a number straight in instead of stepping to it."],
];

export const checklist = [
  "Screen reader: the buttons are named “Fewer quantity” and “More quantity”, never just “minus” and “plus”.",
  "The new number is announced after each press, with its unit.",
  "At a limit, the button says so in words instead of doing nothing silently.",
  "Typing a number out of range corrects it and says what the allowed range is.",
  "Both buttons and the field are at least 44px tall, so they can be used with a thumb.",
];
