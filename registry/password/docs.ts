import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Move from the field to the show button."],
  [["Enter", "Space"], "Show or hide what you have typed."],
];

export const checklist = [
  "Screen reader: the rules are read with the field, so the requirements are known before typing.",
  "Each rule says whether it is met in words, not only with a tick and a colour.",
  "The strength is a word first: the bars are a picture of the same thing.",
  "The show button says what it does and is announced as pressed or not pressed.",
  "Caps Lock being on is said, because it is the usual cause of a password that will not work.",
  "autocomplete=\"new-password\" is set, so password managers offer to make one.",
  "The strength is a hint, never a gate: the rules decide what is allowed.",
];
