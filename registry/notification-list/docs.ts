import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "To mark-all, then to each unread item's own button. Read items have no button, so they are not stops."],
  [["Enter", "Space"], "Mark that one, or all of them, as read."],
];

export const checklist = [
  "Each per-item button is named with the thing it acts on — \"Mark as read: Build 4812 failed on main\" — because a list of five buttons all called \"Mark as read\" is exactly what a screen reader would otherwise read out.",
  "Unread is a word as well as a bar down the left: a coloured dot is not information (WCAG 1.4.1).",
  "The count is part of the heading's text, so it never reads \"Notifications(3)\" — the space is in the text, not a margin.",
  "The unread count is also in a polite status, so marking things read is confirmed without the heading being re-read.",
  "Read items lose their button rather than having it disabled, so Tab walks only what can still be done.",
  "Mark-all disappears when there is nothing left to mark, instead of sitting there doing nothing.",
  "Every button is 44px tall, and each row wraps rather than squeezing on a phone.",
];
