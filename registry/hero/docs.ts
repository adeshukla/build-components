import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [[["Tab"], "Move between the two buttons."]];

export const checklist = [
  "The line above the heading is a paragraph, not a smaller heading: a decorative h2 above an h1 breaks the page outline.",
  "The heading level is an option, because a hero halfway down a page must not be a second h1.",
  "Both buttons are links, so they can be opened in a new tab and read out as links.",
  "The section is labelled by its own heading, which gives screen readers a landmark worth jumping to.",
  "The picture panel is drawn in CSS and carries a description — replace it with your own image and keep the alt text.",
  "Nothing animates and nothing loads: no image request, no script, no layout shift.",
  "The heading balances across lines and the paragraph stops at 65 characters a line.",
];
