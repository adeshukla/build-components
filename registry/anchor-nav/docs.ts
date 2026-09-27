import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Down the list of sections. It is a list of links, so every one is a stop."],
  [["Enter"], "Jump to that section. Focus lands on its heading, so the next Tab carries on from there."],
];

export const checklist = [
  "An ordered list of real links inside a nav with its own heading, so a screen reader can list the sections and jump between them without the mouse.",
  "The section being read is marked with aria-current=\"true\", not \"page\": the page has not changed, only the part of it in view.",
  "It is marked by weight and a bar as well as colour, so it is not colour alone (WCAG 1.4.1).",
  "Following a link moves focus to the heading, not only the scroll position, or the next Tab starts back at the top of the nav.",
  "The current section is worked out from what is on screen, and the answer is kept when nothing is — so it never flickers to nothing between sections.",
  "Smooth scrolling is turned off for anyone who asks for less motion; for some people it causes nausea.",
  "Each link is 44px tall, and the nav only sticks from 768px up — a sticky column on a phone eats the screen.",
];
