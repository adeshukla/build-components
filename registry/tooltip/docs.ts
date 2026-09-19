import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Focus the trigger. The tooltip opens straight away, with no delay."],
  [["Esc"], "Close the tooltip without moving focus."],
];

export const checklist = [
  "Screen reader: the tooltip text is read as the trigger's description, after its name.",
  "The tooltip opens on keyboard focus, not only on hover.",
  "Escape closes it while focus stays on the trigger.",
  "Nothing inside the tooltip needs to be clicked: a tooltip can never hold a link or a button.",
  "At 200% zoom and 320px wide the tooltip stays on screen rather than running off the side.",
  "Windows High Contrast / forced colours: the tooltip still has a visible edge.",
  "On a real iPhone there is no hover, so check the same information is available another way.",
];
