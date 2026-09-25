import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Enter the swatches (one stop), then reach the other-colour picker."],
  [["← →", "↑ ↓"], "Move between swatches, which also picks."],
  [["Enter", "Space"], "On the other-colour picker: open the browser's own colour dialog."],
];

export const checklist = [
  "Screen reader: each swatch says its name (“Ocean”), never only a hex code.",
  "The chosen swatch is marked by a ring, not by colour alone — check it in greyscale.",
  "The chosen colour is announced by name, with its hex code.",
  "Each swatch is at least 24px, with room between them.",
  "If the colour will be used as text or a background, check its contrast before saving it.",
];
