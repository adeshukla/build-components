import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Move to the slide row, then to the buttons and dots under it."],
  [["← →"], "Scroll the slide row while it has focus."],
  [["Enter", "Space"], "Press the focused button: previous, next, a dot, or stop and start."],
];

export const checklist = [
  "Screen reader: the carousel and each slide are announced as such, with the slide's position.",
  "The slide row itself takes focus, so someone using only a keyboard can scroll it.",
  "With automatic rotation on: it stops when you move into it, and the stop button works.",
  "Reduced motion: slides jump instead of gliding, and automatic rotation never starts.",
  "Any image you add has a description that says what it shows, or is left decorative on purpose.",
  "Browser zoom at 200%: the buttons and dots stay on screen and reachable.",
  "On a real iPhone in Safari: slides swipe naturally and snap into place.",
];
