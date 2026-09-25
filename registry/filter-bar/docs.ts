import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Move between the chips, the pills and Clear all."],
  [["Enter", "Space"], "Turn a chip on or off."],
  [["Enter"], "On a pill's ✕, remove that filter; focus returns to its chip."],
];

export const checklist = [
  "Chips are buttons with aria-pressed, so each one is announced as on or off rather than just looking different.",
  "Each group of chips is a group with the group name as its label, so it is clear what Small belongs to.",
  "Removing a pill takes a focusable element out of the page: focus goes back to the chip it came from.",
  "Clear all disappears once nothing is on, so focus moves to the first chip instead of vanishing.",
  "The status line sums up what is applied, so a screen reader hears the result rather than each chip in turn.",
  "Chips are 44px tall and wrap on a phone; nothing is hidden behind a horizontal scroll.",
];
