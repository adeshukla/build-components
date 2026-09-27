import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "To the button — and it stays there while it is working, which the disabled attribute would prevent."],
  [["Enter", "Space"], "Press it. Pressing again while it is working does nothing."],
];

export const checklist = [
  "aria-busy while it works and aria-disabled to say a press will do nothing — never the disabled attribute. Disabling the focused button moves focus to the page body, so the place is lost and nothing is announced.",
  "The second press is ignored in the handler. That is the guard; the greyed look is only the hint.",
  "The label changes to words — Saving… — because a spinner is invisible to a screen reader and means nothing on its own.",
  "The widest of the three labels sets the button's width, so it does not jump as the words change and nothing moves out from under a pointer.",
  "The outcome is said in a polite live region. A button that has stopped spinning is not a message.",
  "The failure says what did not happen, so nobody has to guess whether it half worked.",
  "The spinner is aria-hidden, and under reduced motion it stops turning and simply sits there.",
  "Replace run() with your own request; the states and the wording are the part worth keeping.",
];
