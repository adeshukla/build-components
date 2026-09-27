import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [[["Tab"], "Reach the field. Everything else is ordinary typing and pasting."]];

export const checklist = [
  "The shape is written in the hint before anyone types, rather than being discovered by fighting the field.",
  "Nothing is refused outright: characters that cannot go in a slot are skipped, so a postcode pasted with or without its space both work.",
  "The punctuation is added for you, and never has to be typed.",
  "Being incomplete is checked when the field is left, not on every keystroke, and the message says what is missing.",
  "A mask of digits only gets the numeric keyboard on a phone; a mixed mask keeps the full one so letters can still be typed.",
  "Known ceiling: editing the middle of a finished value returns the caret to the end. Fine for short fields, not for long ones.",
  "Never mask something whose format you are not certain of — a name, an address line, a foreign phone number.",
];
