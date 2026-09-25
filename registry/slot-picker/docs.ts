import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "One stop for the whole picker, then the confirm button."],
  [["← → ↑ ↓"], "Move through the free times, across days, skipping the taken ones."],
  [["Space"], "Pick the time you are on."],
];

export const checklist = [
  "It is one radio group, however many days it spans: picking a time is one choice, so it is one tab stop.",
  "Each day is a group with the date as its name, so a time is announced as belonging to a day.",
  "Taken slots are disabled and say “taken” in words; a dashed border alone tells nobody.",
  "How many times are free is said up front, so nobody hunts through three days of taken slots.",
  "Every announcement carries the day as well as the time — “10:30” on its own means nothing.",
  "Times are printed exactly as given and never converted, so no server and browser disagreement; say whose zone they are in.",
  "Slots are 44px tall and wrap, so a phone shows them without a horizontal scroll.",
];
