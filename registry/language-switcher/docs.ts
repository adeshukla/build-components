import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Enter", "Space"], "Open the list of languages."],
  [["↓ ↑"], "Move between the languages."],
  [["Enter"], "Go to that language's page."],
  [["Escape"], "Close the list and return focus to the button."],
];

export const checklist = [
  "Each language is written in its own language, and carries lang and hreflang so it is pronounced correctly.",
  "They are links, not buttons: a language can be opened in a new tab, bookmarked and found by search engines.",
  "The current language is marked with aria-current and a tick, not by colour alone.",
  "Escape closes the list and focus returns to the button.",
  "The button says what it is (“Language: English”), not just a globe icon.",
  "Send people to the same page in the new language where you can, not to the home page.",
];
