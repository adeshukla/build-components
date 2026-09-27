import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Move to each toggle — several answers means several stops, unlike a radio group."],
  [["Space"], "Turn the one you are on off or on."],
];

export const checklist = [
  "They are checkboxes under a legend, not buttons: the form sends them, and each is announced as an answer to the same question.",
  "The last one left carries aria-disabled and refuses the click, rather than quietly springing back on.",
  "What is picked is said in a status line, because a filled background is not information.",
  "Each toggle is 44px tall, and the group wraps rather than scrolling sideways on a phone.",
  "Use a segmented control instead when only one answer is possible — that is a radio group, and it is a single tab stop.",
];
