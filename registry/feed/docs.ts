import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Move through the items, then to Load more."],
  [["Page Down", "Page Up"], "On an item: jump to the next or previous item."],
  [["Enter", "Space"], "On Load more: load the next items and move to the first new one."],
];

export const checklist = [
  "Screen reader: the feed is announced by name; each item reads its title, summary and position (e.g. 5 of 10).",
  "After Load more, focus is on the first new item and the new count is announced once.",
  "In scroll mode, new items load without moving focus or the page.",
  "The Load more button is always there until everything is shown, so nobody depends on scrolling.",
  "The end is stated in words, not just by the button disappearing.",
  "Replace the demo delay with your real request, and show an error with a Try again button if it fails.",
];
