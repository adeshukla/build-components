import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "From the panel to the retry button, and on to the technical detail."],
  [["Enter", "Space"], "Retry, or open the detail."],
];

export const checklist = [
  "A focusable region with a heading, not role=\"alert\". An alert reads the whole panel over whatever else is happening, and once it has been read there is no way back to it.",
  "Focus moves to the panel rather than to the retry button, so the reason is read before it is retried.",
  "It names what failed. \"Oops\" and \"Something went wrong\" tell nobody which of the six things on the page is broken.",
  "It says whether anything changed. That is the first thing anyone wants to know after a failure, and almost no error state answers it.",
  "There is somewhere to go: a retry in the panel, not just a heading and a shrug.",
  "The technical line is a disclosure, so it is there for whoever has to report it and out of the way of everyone else.",
  "The warning glyph is aria-hidden: the heading already says it is an error.",
  "Everything in it is 44px tall, including the disclosure summary.",
];
