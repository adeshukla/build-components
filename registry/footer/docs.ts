import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab", "Shift + Tab"], "Move through the links in the order they are written."],
  [["Enter"], "Follow the focused link."],
];

export const checklist = [
  "Screen reader: the footer is announced as the page's content information landmark.",
  "The link group has a name of its own, so it is not confused with the main menu.",
  "Every link makes sense read on its own, out of context, in a list of links.",
  "Social links name the service in their text, not only in an icon.",
  "Browser zoom at 200%: the columns fold into one instead of overlapping.",
  "Windows High Contrast / forced colours: links are still distinguishable from plain text.",
  "On a real iPhone in Safari: links are far enough apart to tap without hitting the wrong one.",
];
