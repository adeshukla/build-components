import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Move between the two fields, and between hours and minutes inside one."],
  [["↑", "↓"], "Change the hours or minutes the cursor is in, by the step you set."],
  [["Space"], "Open the browser's own time picker on the field you are in."],
];

export const checklist = [
  "Two native time inputs: the browser supplies the clock, the 12- or 24-hour display the person's device uses, and the phone's time wheel.",
  "How long the span is is said in words — three hours thirty minutes, not 3:30, which reads as half past three.",
  "An overnight span is a real answer for opening hours and shift patterns, so it is an option rather than always an error.",
  "A backwards span is marked with aria-invalid and explained in an alert next to the second field, as it happens.",
  "The step applies to both fields, so the two can never disagree about what a valid time is.",
  "Both fields are 44px tall and stack on a narrow screen.",
];
