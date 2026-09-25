import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Move through the cards and their move buttons."],
  [["Enter", "Space"], "Move the card one column left or right."],
];

export const checklist = [
  "Every card can be moved with the keyboard: a board that only takes drag and drop fails WCAG 2.1.1 and 2.5.7.",
  "Each move button says where the card is going (“Move Sand the deck to In progress”), not just an arrow.",
  "After a move, focus follows the card into its new column instead of dropping to the page.",
  "The move is announced with its new position, because a card jumping columns is silent otherwise.",
  "Columns are sections with the column name as their heading, and the count is part of that heading.",
  "On a phone the columns stack rather than scrolling sideways.",
];
