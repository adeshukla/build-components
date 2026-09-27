import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "To the two buttons. Both stay reachable at the ends, so the reason can be read."],
  [["Enter", "Space"], "Load that page. Focus moves to the list's heading, so the new rows are read from the top."],
];

export const checklist = [
  "Two buttons and no page numbers, which is the honest shape for a list whose length nobody knows — a cursor finds the end by getting a short page back.",
  "The ends carry aria-disabled rather than disabled: a disabled button cannot be focused, so nobody on a keyboard ever finds out why it will not work.",
  "The reason is real text on the page, tied to its button with aria-describedby, not a tooltip and not greying alone.",
  "After a page loads, focus moves to the list's heading. Without it the new rows are above where the keyboard is and nothing says they arrived.",
  "Which rows these are is announced politely, which is the only way anyone not looking knows the page changed at all.",
  "The arrows are aria-hidden decoration; the buttons are named by their words.",
  "Both buttons are 44px tall and wrap rather than squeezing on a phone.",
];
