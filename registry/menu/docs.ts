import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Enter", "Space"], "Open the menu and go to its first item."],
  [["↓", "↑"], "Open the menu at the first or last item, then move between items."],
  [["Home", "End"], "Jump to the first or last item."],
  [["A–Z"], "Jump to the next item that starts with what you type."],
  [["Esc"], "Close the menu and put focus back on the button."],
  [["Tab"], "Close the menu and carry on through the page."],
];

export const checklist = [
  "Screen reader: the button is announced as having a menu, and as collapsed or expanded.",
  "Each item is announced as a menu item, with its position in the list.",
  "Arrow keys wrap from the last item to the first, and Escape returns focus to the button.",
  "Tab closes the menu instead of walking through the items behind it.",
  "Clicking outside closes the menu without choosing anything.",
  "Browser zoom at 200%: the menu stays on screen instead of running off the edge.",
  "On a real iPhone in Safari: tapping the button opens it, and tapping elsewhere closes it.",
];
