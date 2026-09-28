import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Nothing to stop on. It is a readout, not a control: there is nothing here to operate."],
];

export const checklist = [
  "Where the order is is said in one sentence before the list. It is the answer most people came for, and the only part anyone has to hear to get it.",
  "Each step's state is a word — Done, Happening now, Still to come — never the tick or the colour alone (WCAG 1.4.1).",
  "The current step carries aria-current=\"step\", which is the value for a position in a sequence.",
  "The ticks and circles are aria-hidden: they are pictures of the state the words already give.",
  "It is an ordered list, so a screen reader counts the steps and says which of how many.",
  "A step with no date yet has no date shown, rather than an invented estimate.",
  "Dates are real time elements written out in full, formatted by hand so the server and the browser agree.",
  "Nothing is focusable and there is no JavaScript: this is a readout, and treating it as a control would add tab stops that do nothing.",
];
