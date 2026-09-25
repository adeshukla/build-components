import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Move between the header buttons and the column edges."],
  [["Enter", "Space"], "Sort by that column; again to reverse it."],
  [["← →"], "On a column edge, make that column narrower or wider."],
  [["Shift", "← →"], "The same, in bigger steps."],
  [["Home"], "On a column edge, put that column back to its starting width."],
];

export const checklist = [
  "It is a real table: caption, scope on every header, and the row name as a row header.",
  "Sorting reports aria-sort on the column, so a screen reader knows which one is sorted and which way.",
  "The rows move without warning, so a status line says what it was sorted by.",
  "Columns resize with the arrow keys as well as by dragging — a drag-only handle fails WCAG 2.5.7.",
  "The resize handle is a focusable separator with a width value, not an unlabelled div.",
  "The header stays put by scrolling the wrapper, not the page, so it works inside any layout.",
  "The scrolling wrapper takes focus and is named by the caption, so it can be scrolled by keyboard on a narrow screen.",
  "Check a long column name at 320px wide: cells clip with an ellipsis rather than breaking the layout.",
];
