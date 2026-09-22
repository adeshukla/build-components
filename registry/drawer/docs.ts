import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Enter", "Space"], "On the button: open the drawer. Focus moves to its title."],
  [["Tab", "Shift + Tab"], "Move through the drawer. Focus wraps and never reaches the page behind."],
  [["Escape"], "Close the drawer and return focus to the button that opened it."],
];

export const checklist = [
  "Screen reader: opening reads the drawer's title and intro, and the page behind can't be reached.",
  "Focus returns to the Filters button however the drawer closes: Escape, ×, outside click or swipe.",
  "The page behind doesn't scroll while the drawer is open; long content scrolls inside it.",
  "With reduced motion turned on, it appears without sliding.",
  "Phone width: a side drawer leaves a strip of the page showing, so it reads as a panel, not a new page.",
  "On a real phone: swiping it toward its edge closes it, and a short swipe doesn't.",
];
