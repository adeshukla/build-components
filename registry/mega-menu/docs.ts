import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab", "Shift + Tab"], "Move along the bar, and through an open panel in reading order."],
  [["Enter", "Space"], "Open or close the focused menu."],
  [["↓"], "Open the menu and go straight to its first link."],
  [["Esc"], "Close the open panel and put focus back on its button."],
];

export const checklist = [
  "Screen reader: each menu button is announced as collapsed or expanded, and the column headings are read.",
  "Only one panel is open at a time, and clicking outside closes it.",
  "With hover opening switched on, the menu can still be opened and closed by keyboard alone.",
  "Long panels: every link is reachable by Tab without the panel closing under you.",
  "Browser zoom at 200%: panels stay inside the screen instead of running off the edge.",
  "Windows High Contrast / forced colours: the open panel still has a visible edge.",
  "On a real iPhone in Safari: tapping a menu opens it, and tapping elsewhere closes it.",
];
