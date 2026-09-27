import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Into the field, and on to the retry button when a save has failed."],
  [["Enter", "Space"], "Press retry."],
];

export const checklist = [
  "The state is a polite status beside the label, not an alert: an assertive region would interrupt the very typing it is reporting on.",
  "Four states are said in words — not saved yet, saving, saved at 14:32, could not save — because a spinner or a tick is not a message.",
  "A failure leaves the text in the field and offers one button. Nothing is ever cleared on the person's behalf.",
  "The save waits for a rest in the typing, so one paragraph is one request rather than one per letter.",
  "The time is written out by hand, never by locale, so the server and the browser agree.",
  "Replace saveDraft with your own request; the states, the wording and the retry are the part worth keeping.",
];
