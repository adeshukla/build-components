import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["← →", "↑ ↓"], "Move the focused handle by one step."],
  [["Home", "End"], "Jump to the bottom or the top of the scale."],
  [["Page Up", "Page Down"], "Move by a larger jump, as the browser decides."],
];

export const checklist = [
  "Screen reader: each handle is announced with its own name, its value and the scale it sits on.",
  "The value is read as you set it, with its symbol or unit, not as a bare number.",
  "Both ends of a range can be reached and moved by keyboard alone.",
  "The two handles cannot cross: the lowest stops at the highest and the other way round.",
  "The value is shown in text as well as by the position of the handle.",
  "Windows High Contrast / forced colours: the handles and the filled track are still visible.",
  "On a real iPhone in Safari: the handles are big enough to drag with a thumb.",
];
