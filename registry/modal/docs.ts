import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Enter", "Space"], "On the trigger button: open the modal."],
  [["Tab", "Shift + Tab"], "Move between the modal's buttons. Focus wraps and never leaves the modal."],
  [["Escape"], "Close the modal and return focus to the trigger button."],
  [["Enter", "Space"], "On a button inside: run its action and close."],
];

export const checklist = [
  "Screen reader (NVDA or Narrator): opening reads the modal's title and body text.",
  "Focus starts on the title (or the primary button, if set), and Tab never leaves the modal.",
  "Escape closes the modal and focus returns to the trigger button.",
  "The page behind the open modal doesn't scroll.",
  "With reduced motion turned on in Windows settings, the modal opens without animation.",
  "Phone width and 200% zoom: long body text scrolls inside the modal and every button stays reachable.",
  "On a real iPhone in Safari: the bottom sheet sits flush with the bottom edge.",
];
