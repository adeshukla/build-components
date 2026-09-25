import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Move from the country to the number."],
  [["↑ ↓", "a–z"], "In the country list: move between countries, or jump by first letter."],
  [["0–9"], "Type the number. Spaces are added the way that country writes them."],
];

export const checklist = [
  "Screen reader: the country list is named “Country code”, and each option includes its dial code.",
  "Grouping is a convenience, not a rule: check the number properly on your server.",
  "Your server gets one value — dial code plus digits — not the spaced version.",
  "The phone keypad opens on a phone (inputmode tel), and browsers can fill it (autocomplete tel-national).",
  "A too-short number is explained in words when you leave the field, not while you type.",
  "Say why you want the number. Ask for it only when you'll actually use it.",
];
