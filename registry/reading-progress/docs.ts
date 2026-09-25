import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Move through the contents links."],
  [["Enter"], "Jump to that section."],
];

export const checklist = [
  "Screen reader: the bar reads as a progress bar with a percentage; the contents list reads as navigation.",
  "The current section is marked with aria-current, not only by colour and weight.",
  "The bar is decoration for the reader's comfort: nothing depends on being able to see it.",
  "With reduced motion on, the bar jumps instead of easing.",
  "The bar sits above the page without covering a sticky header or a skip link.",
  "Each contents link is at least 24px tall, including its padding.",
];
