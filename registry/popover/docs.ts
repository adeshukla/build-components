import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Enter", "Space"], "Open the popover. Focus moves to the first thing inside it."],
  [["Tab", "Shift + Tab"], "Move through the actions inside."],
  [["Esc"], "Close it and put focus back on the trigger."],
];

export const checklist = [
  "Screen reader: opening it is announced as a dialog with its heading, because focus has moved.",
  "Escape closes it and focus returns to the trigger, not to the top of the page.",
  "Unlike a tooltip, everything inside can be reached and used by keyboard.",
  "Clicking outside closes it — or does not, if you turned that off on purpose.",
  "At 320px wide the popover fits the screen instead of running off the side.",
  "Windows High Contrast / forced colours: the popover still has a visible edge.",
  "On a real iPhone in Safari: tapping the trigger opens it and tapping elsewhere closes it.",
];
