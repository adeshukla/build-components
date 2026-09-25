import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Reach the retry button while the banner is up."],
  [["Enter", "Space"], "Check the connection again."],
];

export const checklist = [
  "The banner is a status region, not an alert: it is said at the next pause instead of cutting across what someone is reading.",
  "Nothing is announced on load — the “back online” line only appears after a drop, so a page that starts online stays quiet.",
  "The message says what still works and what is kept, rather than only that the connection went.",
  "navigator.onLine is treated as a hint: it knows the network is there, not that your server answered, which is what the retry button is for.",
  "The banner is not colour alone: the words carry the message, so it reads the same to a screen reader.",
  "At the top or bottom it is sticky rather than fixed, so it keeps its own space instead of covering the first thing on the page.",
];
