import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [[["Tab"], "Nothing to operate: these are steps to read, not a form to fill in."]];

export const checklist = [
  "It is an ordered list, so the sequence is in the markup rather than only in the drawn numbers.",
  "The circles and the connecting line are aria-hidden: they are a picture of the order, not the order itself.",
  "Each step has a real heading, so the steps can be jumped between.",
  "The section is labelled by its heading, which makes it a landmark.",
  "Four steps across a wide screen, stacked on a phone, with nothing hidden behind a sideways scroll.",
  "If a step is something people must do in your app, link it from the step's text — this component deliberately holds no buttons.",
];
