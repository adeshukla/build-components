import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab", "Shift + Tab"], "Move to any finished step that can be gone back to."],
  [["Enter"], "Go back to the focused step."],
];

export const checklist = [
  "Screen reader: the run is announced with its name, then each step with its state in words.",
  "Finished, current and not started are said in words, not carried by a tick or a colour alone.",
  "The current step is marked with aria-current, so it can be found without looking.",
  "Steps not yet reached are not links: there is nothing there to open.",
  "On a phone the steps stack and each one still shows its state.",
  "Windows High Contrast / forced colours: the current step is still obvious.",
];
