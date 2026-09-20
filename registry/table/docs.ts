import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Move to each column heading, then through the row checkboxes."],
  [["Enter", "Space"], "Sort by the focused column, or tick the focused row."],
  [["← →"], "Scroll the table sideways when it is wider than the screen."],
];

export const checklist = [
  "Screen reader: the caption is read first, then each cell with its column heading.",
  "Sorting: the sorted column is announced as ascending or descending, not just visually marked.",
  "Each row checkbox has a name of its own, taken from the row, so they are not five identical checkboxes.",
  "The selected count is announced as it changes, without moving focus.",
  "On a phone: stacked rows still say which column each value belongs to.",
  "If you keep the table and scroll instead, the scrolling area can be reached and moved by keyboard.",
  "Browser zoom at 200%: the table scrolls rather than overlapping the page.",
];
