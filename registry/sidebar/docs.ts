import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab", "Shift + Tab"], "Move through the section headings and the links under them."],
  [["Enter", "Space"], "Fold a section away, or follow the focused link."],
  [["Esc"], "Close the drawer on a narrow screen, and put focus back on its button."],
];

export const checklist = [
  "Screen reader: the sidebar is announced as navigation with its name, and each section as a heading.",
  "The current page is marked with aria-current, not only by its colour.",
  "A count beside a link is read with a word after it, so it is not just a number.",
  "Collapsible sections announce themselves as expanded or collapsed.",
  "On a phone: the drawer opens from a button, Escape closes it, and focus goes back to the button.",
  "Browser zoom at 200%: the sidebar becomes the drawer rather than squeezing the page.",
];
