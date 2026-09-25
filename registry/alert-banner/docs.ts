import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Reach the action link and the dismiss button."],
  [["Enter"], "Follow the action."],
  [["Enter", "Space"], "On dismiss: remove the message and move focus somewhere sensible."],
];

export const checklist = [
  "Screen reader: the tone is spoken first (“Error:”, “Warning:”), so the colour is never the only clue.",
  "An error interrupts (role=alert); the other tones wait their turn (role=status).",
  "A banner added after the page loads is announced; one that is there from the start is read in place.",
  "Dismissing never leaves focus on nothing: mark the landing spot with data-after-dismiss.",
  "Only make a banner dismissible if missing it is harmless.",
  "Windows High Contrast / forced colours: the icon and the border still show which tone it is.",
];
