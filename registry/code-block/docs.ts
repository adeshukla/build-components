import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Reach Wrap lines, Copy and the code itself."],
  [["Enter", "Space"], "Copy the code, or turn wrapping on and off."],
  [["← → ↑ ↓"], "Scroll the code once it has focus."],
];

export const checklist = [
  "Copying can be refused — in a sandboxed frame, or without permission — so the fallback selects the code and says which keys to press.",
  "“Copied” is a status message, not a change of button label that a screen reader would miss.",
  "The message clears itself after a few seconds, so it does not sit there claiming a copy that happened a minute ago.",
  "Line numbers are aria-hidden and unselectable, so they are never read out and never end up in the clipboard.",
  "The scrolling box takes focus, so long lines can be scrolled without a pointer.",
  "Wrap lines is a toggle button with aria-pressed, so its state is announced.",
  "It is a real pre and code, so whitespace survives and the text is announced as code.",
];
