import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Enter", "Space"], "On the start button: begin. Focus moves to the first step."],
  [["Tab"], "Move between Skip, Back and Next inside the step."],
  [["Escape"], "End the tour from anywhere and return to the start button."],
];

export const checklist = [
  "Screen reader: each step is read as a dialog with its title and text, and the step count.",
  "Focus moves to every new step, and back to the start button when the tour ends or is skipped.",
  "The tour never traps anyone: Skip and Escape work at every step.",
  "Each target scrolls into view, without smooth scrolling when reduced motion is on.",
  "Phone width: the step stays on screen and never covers the element it points at.",
  "Keep tours short and optional. Nothing on the page should only be explained inside the tour.",
];
