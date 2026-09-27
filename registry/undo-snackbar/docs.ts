import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "From the action to the snackbar's Undo and Dismiss. Focus is never moved there for you."],
  [["Enter", "Space"], "Undo, or dismiss and keep the change."],
];

export const checklist = [
  "The clock stops while the snackbar is hovered or has focus inside it, and nought seconds means it never runs at all. A time limit that cannot be extended fails WCAG 2.2.1 Timing Adjustable.",
  "The words live in a live region of their own; the snackbar is not one. A region containing a button is read as a lump of text, and re-reads itself on every countdown tick.",
  "Focus is never moved to the snackbar. Taking it interrupts whatever the person was doing, and the action has already happened — the button is one Tab away instead.",
  "It is a polite status, not an alert. An alert for something that already worked is an interruption with no decision in it.",
  "Expiring is announced too. Silence is not a result: without it, nobody not looking knows whether the undo window has closed.",
  "The countdown is a number, not a shrinking bar, and it is aria-hidden — a bar says nothing to anyone who cannot see it.",
  "Undo and Dismiss are both 44px, and the accent is contrast-corrected against the dark panel rather than against the page.",
  "For anything genuinely destructive, set the seconds to nought so the only way out is a deliberate press.",
];
