import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Move from the number to the unit."],
  [["↑ ↓"], "Change the unit, as in any select."],
];

export const checklist = [
  "The unit is its own field with its own label and its own form value, so the server never has to guess what 12 means.",
  "The unit label is off-screen rather than missing: a select with no label is announced as an unnamed combobox.",
  "inputmode decimal gives a phone the number keyboard without refusing pasted text.",
  "The number and the unit are read back together in a status line, because that is how the answer will be used.",
  "The error names the range in words; it appears on leaving the field and then follows the typing.",
  "Numbers are set in tabular figures so they do not jitter as they are typed.",
];
