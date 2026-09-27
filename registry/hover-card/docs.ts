import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "To the link. The card opens on focus as well as on hover — hover alone locks out every keyboard."],
  [["Esc"], "Dismiss the card without moving the pointer or losing your place."],
  [["Enter"], "Follow the link. The card is an extra; the link is the way to the information."],
];

export const checklist = [
  "All three of what WCAG 1.4.13 asks of content shown on hover: Escape dismisses it without moving the pointer, the pointer can travel from the link onto the card without it vanishing, and it stays until dismissed or the pointer leaves.",
  "It opens on focus as well as on hover. Hover alone means no keyboard, and no touch screen, ever sees it.",
  "Nothing inside the card is interactive. A tooltip must not hold controls — if your preview needs its own buttons, that is a popover, not a hover card.",
  "The trigger is a real link to the same place, so the card is never the only route to what it says.",
  "aria-describedby ties the card to the link only while it is open, so a screen reader reads the preview as a description rather than as loose text on the page.",
  "The opening delay is long enough that a pointer crossing the link does not fire it; the closing delay is long enough to reach the card.",
  "Escape is heard on the document, not on the link — Safari does not focus a clicked link, so a local listener would miss it.",
];
