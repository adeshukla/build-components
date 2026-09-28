import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "One stop per person, and only for the ones whose name is a link."],
];

export const checklist = [
  "A list of people, not a grid of headings. Twelve names as h3s puts twelve entries in the page's outline that nobody wants to navigate by, and buries the real headings around them.",
  "The list is named by the section's heading, so a screen reader says how many people are in it before reading them.",
  "The initials circle is aria-hidden: the name is right beside it, so the circle is decoration whatever it contains.",
  "No names and no photographs ship with this part — the defaults are marked [TODO] rather than invented people, and the note says to ask before publishing anyone.",
  "A linked name is underlined as well as coloured, so the link is not identified by colour alone.",
  "The role sits under the name as a plain pair, rather than as a second heading level.",
  "No JavaScript at all.",
];
