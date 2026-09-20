import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab", "Shift + Tab"], "Move along the controls: previous, the page numbers, next."],
  [["Enter", "Space"], "Go to the focused page."],
];

export const checklist = [
  "Screen reader: the set is announced as navigation with its name, e.g. “Orders navigation”.",
  "Each number is announced as “Page 4”, not just “4”, and the current one as the current page.",
  "The gap between runs of pages is decoration: it is never focusable and is hidden from screen readers.",
  "Previous on page one and next on the last page are disabled, not missing, so nothing moves under you.",
  "With a link pattern set, each page is a real link you can open in a new tab.",
  "At 320px the controls wrap onto more lines instead of running off the side.",
  "Every control is at least 40px, so it can be tapped without care.",
];
