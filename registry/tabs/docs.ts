import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Move to the selected tab, then on to its panel. The other tabs are skipped."],
  [["← →"], "Move between tabs in a row. Up and Down when the tabs are stacked."],
  [["Home", "End"], "Jump to the first or last tab."],
  [["Enter", "Space"], "Show the focused tab's panel. Only needed when activation is manual."],
];

export const checklist = [
  "Screen reader: each tab is announced as a tab with its position, and the selected one as selected.",
  "The tab set name is read out, so the tabs make sense without seeing the page.",
  "Arrow keys wrap from the last tab to the first, and Tab leaves the set instead of walking through it.",
  "Manual activation: moving with the arrows does not change the panel until you press Enter or Space.",
  "Browser zoom at 200%: long tab rows scroll sideways instead of overlapping.",
  "Windows High Contrast / forced colours: the selected tab is still obvious.",
  "On a real iPhone in Safari: tabs are easy to tap and the row scrolls with a swipe.",
];
