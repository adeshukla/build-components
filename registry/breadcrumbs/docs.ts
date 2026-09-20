import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab", "Shift + Tab"], "Move along the trail. The current page is text, not a link, so it is skipped."],
  [["Enter"], "Follow the focused step."],
];

export const checklist = [
  "Screen reader: the trail is announced as navigation named Breadcrumb, then as a list of steps.",
  "The current page is marked as such and is not a link: there is nowhere for it to go.",
  "The separator is decoration and is never read out.",
  "The home icon is beside its text, never instead of it.",
  "On a phone the trail collapses to the first step and the current page, and still fits on one line.",
  "Windows High Contrast / forced colours: the links are still underlined.",
];
