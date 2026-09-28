import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "One stop, and only when there is a link. The ticks and the panel are not controls."],
];

export const checklist = [
  "The words come first in the source whichever side the picture is on. Only the grid column changes, so the reading order never depends on the layout — swapping sides with `order` or `row-reverse` is how a page ends up read back to front.",
  "One heading, at the level you choose, naming the section it labels with aria-labelledby.",
  "The points are a real list, so a screen reader says how many there are before reading them.",
  "The ticks are aria-hidden. It is already a list; a tick read out before every item says nothing and takes time.",
  "The picture's shape is set in CSS, so the column does not change height when the file arrives.",
  "An empty description means the picture is decoration and is hidden; filling it in makes it an image with a name. Both are deliberate choices, and neither is \"forgot the alt\".",
  "No image ships with this part, and the placeholder says so rather than filling the space with a stock photograph.",
  "It becomes one column below 768px, with the words above the picture, because that is the order they should be read in.",
  "No JavaScript at all.",
];
