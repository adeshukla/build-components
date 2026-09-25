import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Reach the button once it has appeared."],
  [["Enter", "Space"], "Go to the top: the page scrolls and focus moves there too."],
];

export const checklist = [
  "Focus moves to the top, not just the scroll position — otherwise the next Tab carries on from the bottom.",
  "The button is named in words even when only the arrow is shown.",
  "With reduced motion on, the page jumps instead of gliding.",
  "It doesn't cover anything important on a phone; check it against the bottom of a long form.",
  "It appears only after enough scrolling to be useful, and is at least 44px.",
];
