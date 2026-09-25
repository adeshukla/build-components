import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "One stop for the whole bar, then straight past it."],
  [["← →"], "Move between the items (↑ ↓ when it is vertical)."],
  [["Home", "End"], "Jump to the first or last item."],
  [["Enter", "Space"], "Press the item you are on."],
];

export const checklist = [
  "One tab stop for the whole toolbar, as the APG pattern says — twelve buttons should not be twelve stops on the way to the page.",
  "The arrow keys wrap around, and Home and End reach the ends.",
  "Only the current item is tabbable; the rest carry tabindex -1, which is what makes the single stop work.",
  "Clicking or focusing an item moves the stop with it, so Tab never lands somewhere unexpected.",
  "aria-orientation matches the layout, so a screen reader offers the right arrow keys.",
  "Toggles carry aria-pressed and are announced as on or off; actions are plain buttons.",
  "Pressing something in a toolbar usually changes something elsewhere, so a status line says what happened.",
];
