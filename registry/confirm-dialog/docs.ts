import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Enter", "Space"], "Open the dialog."],
  [["Tab"], "Cycle through the field and the two buttons; focus cannot leave the dialog."],
  [["Escape"], "Cancel, with focus back on the button that opened it."],
];

export const checklist = [
  "It is a native dialog opened with showModal, so the rest of the page is inert without a hand-rolled overlay.",
  "The dialog is labelled by its title and described by its message, so both are read on open.",
  "Focus starts in the field (or on Cancel), and comes back to the trigger on close.",
  "Tab is kept inside the dialog, including backwards with Shift.",
  "The confirm button is really disabled, not just faded, and the hint says what will turn it on.",
  "The phrase is matched as typed: a different case does not get through.",
  "Escape counts as cancel and is announced, rather than closing without a word.",
];
