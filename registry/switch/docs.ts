import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Reach the switch."],
  [["Space"], "Turn it on or off."],
];

export const checklist = [
  "Screen reader: reads the label, then “switch”, then on or off — not “tick box”.",
  "The whole row is clickable, and the switch itself is at least 24px.",
  "The state is shown in words as well as by the position of the knob.",
  "Windows High Contrast / forced colours: on and off still look different.",
  "With reduced motion on, the knob moves without sliding.",
  "A switch applies straight away. If the change needs saving, use a checkbox and a Save button instead.",
];
