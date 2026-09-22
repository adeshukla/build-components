import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Space", "Enter"], "On a handle: pick the item up. Press again to drop it."],
  [["↑", "↓"], "While picked up: move the item one place."],
  [["Escape"], "While picked up: put everything back where it was."],
  [["Tab"], "Move between handles and move buttons. Leaving a picked-up item drops it."],
];

export const checklist = [
  "Screen reader: each handle reads as a toggle button named after its item, with how to use it.",
  "Picking up, every move and dropping are each announced once, with the new position (e.g. 3 of 5).",
  "Focus stays on the same handle or button as the item moves.",
  "Everything can be reordered without dragging: the move buttons, or the keyboard.",
  "Escape after a few moves puts the whole list back as it was.",
  "On a phone: dragging a handle moves the item and doesn't scroll the page; the rest of the row still scrolls.",
  "Windows High Contrast / forced colours: the item being moved is still outlined.",
];
