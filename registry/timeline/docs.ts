import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Reach the reveal button."],
  [["Enter", "Space"], "Reveal the older entries; focus lands on the first one that arrives."],
];

export const checklist = [
  "It is an ordered list, so the sequence is carried by the markup rather than by the line down the side.",
  "The dots and the thread are aria-hidden: they are the picture of the order, not the order itself.",
  "Each time is a real time element, with the readable wording in the text and the stamp in the attribute.",
  "The reveal button says how many are left (“Show older (3)”), not just “more”.",
  "The button disappears once everything is out, so focus moves to the first revealed entry instead of nowhere.",
  "Times are written as you want them read — never formatted by Intl, which disagrees between server and browser.",
];
