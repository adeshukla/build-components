import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["0–9", "."], "Type the amount. Commas and the symbol are added for you."],
  [["Tab"], "Leave the field: the amount is tidied and an unreadable one is explained."],
];

export const checklist = [
  "Screen reader: the currency is part of the field's name (“Amount in £”), not a stray symbol before it.",
  "Typing is never fought with: the amount is only tidied when you leave the field.",
  "Your server gets a plain number in the hidden field, not “£1,250.00”.",
  "Amounts are written by hand, never by Intl, so the server and the browser always agree.",
  "The number keypad opens on a phone (inputmode decimal).",
  "An amount that can't be read is explained with an example, and the field is marked invalid.",
];
