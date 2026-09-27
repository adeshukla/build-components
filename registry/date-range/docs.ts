import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Move between the two fields. Each one is a native date input, so the browser's own picker and typing both work."],
  [["↑", "↓"], "Change the part of the date the cursor is in."],
  [["Space"], "Open the browser's date picker on the field you are in."],
];

export const checklist = [
  "Two native date inputs under one legend: the browser supplies the calendar, the keyboard entry and the phone's date wheel, all of which are better than a hand-built pair.",
  "Each field narrows the other's limits, so the impossible days are greyed out in the picker rather than refused after the fact.",
  "Out of order is said in an alert next to the second field and marked with aria-invalid, as soon as it happens rather than on submit.",
  "The span is read back in words in a polite status line, because a highlighted strip between two fields is not information.",
  "Dates are formatted by hand, never by locale, so the server and the browser agree.",
  "Both fields are 44px tall and stack on a narrow screen.",
];
