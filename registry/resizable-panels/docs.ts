import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["← →"], "Side by side: make the first panel smaller or bigger by one step."],
  [["↑ ↓"], "One above the other: the same, up and down."],
  [["Home", "End"], "Jump to the smallest or largest size."],
  [["Enter"], "Collapse the first panel; press again to bring it back at its last size."],
];

export const checklist = [
  "Screen reader: the divider reads as a separator with its name and the first panel's size (e.g. Files 35%).",
  "The divider is reached with Tab and shows a clear focus colour.",
  "The divider is easy to grab with a mouse or a finger, though the visible line is thin.",
  "Collapsing never loses focus, and the collapsed panel is hidden from screen readers too.",
  "At 200% zoom, content in both panels scrolls instead of being cut off.",
  "Windows High Contrast / forced colours: the divider is still visible.",
];
