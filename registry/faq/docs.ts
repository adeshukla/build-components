import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Move between the questions and the open-all button."],
  [["Enter", "Space"], "Open or close the answer you are on."],
];

export const checklist = [
  "Answers are native details and summary: opening, closing, the keyboard and the browser's find-on-page all work with no script.",
  "The open-all button sets the state on the elements themselves, so nothing is mirrored and nothing can drift.",
  "It reports aria-pressed and changes its own wording, so its state is announced.",
  "The plus sign is aria-hidden decoration; it rotates, and stops rotating for anyone who asks for less motion.",
  "Answers are capped at 65 characters a line, which is where long text stops being readable.",
  "For search engines, add FAQPage structured data on the page itself — deliberately not baked into the component, so it is never out of step with the questions you actually ship.",
];
