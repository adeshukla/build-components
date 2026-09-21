import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["⌘ K", "Ctrl + K"], "Open the search from anywhere on the page."],
  [["↓ ↑"], "Move through the results. The caret stays in the box, so you can keep typing."],
  [["Enter"], "Go to the highlighted result."],
  [["Esc"], "Close the search and put focus back where it was."],
];

export const checklist = [
  "Screen reader: the box is announced as a search combobox, and each result with its group.",
  "How many results there are is announced as you type, so nobody types into silence.",
  "The shortcut is shown on the button, so people who do not know it can still find it.",
  "Every word typed has to match: “screen nvda” finds the screen reader guide, not everything with “screen” in it.",
  "Nested data works: a guide inside a guide shows its trail, e.g. Accessibility › Keyboard support.",
  "Closing the dialog returns focus to the button that opened it.",
  "Links in the data are checked: anything that is not a web, mail or phone link goes nowhere.",
];
