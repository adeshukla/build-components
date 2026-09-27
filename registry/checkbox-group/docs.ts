import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Move to each box — a checkbox group is not one stop, unlike radios."],
  [["Space"], "Tick or untick the box you are on."],
];

export const checklist = [
  "It is a fieldset with a legend, so every box is announced as an answer to the same question.",
  "The “everything” box uses the indeterminate state when only some are ticked — a third state you can only set from script.",
  "Checkboxes are native, so Space works, the form submits them and the browser's own styling follows the accent colour.",
  "The count is a polite status line, not a live region that fires on every tick.",
  "The error is an alert tied to the fieldset with aria-describedby, and it clears as soon as enough are picked.",
  "Each row is 44px tall, and the note sits inside the label so tapping it still ticks the box.",
];
