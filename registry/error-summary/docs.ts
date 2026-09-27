import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Enter"], "Submit the form. If anything is wrong, focus lands on the summary."],
  [["Tab"], "Down the list of problems, then into the form."],
  [["Enter"], "On a problem, jump to the answer that has to change."],
];

export const checklist = [
  "Focus moves to the summary, not to the first bad field: the list is the thing that has to be read before anything is corrected.",
  "The summary is a focusable region with a heading, so the move announces it once. A live region would read it a second time.",
  "Every problem is an instruction — enter your full name — not a label plus the word invalid.",
  "Each line is a real link to its field, at least 24px tall, so a pointer and a keyboard both reach it.",
  "The message is repeated at the field as well, because the summary is off screen by the time the answer is being changed.",
  "The form carries novalidate: the browser's own bubbles cannot be styled, are not announced consistently and vanish on the next keystroke.",
  "Once shown, a problem clears as the answer is typed rather than waiting for another submit.",
];
