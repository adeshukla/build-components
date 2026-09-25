import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Move between the field, Back and Next."],
  [["Enter", "Space"], "Go on to the next step, or send it on the last one."],
];

export const checklist = [
  "Each step moves focus to its own heading: a step is a new page as far as a screen reader is concerned, and focus would otherwise stay on a button that has changed meaning.",
  "The heading carries “Step 2 of 4”, so the position is read out rather than only drawn.",
  "The step list marks the current step with aria-current and an off-screen “Current step:”, not with colour alone.",
  "A needed field blocks Next with a message in an alert, aria-invalid on the field and focus moved to it.",
  "Once the error shows, it clears as they type rather than waiting for blur — an error that disappears on blur moves the button out from under the pointer.",
  "Going back keeps every answer, so nothing is retyped.",
  "The last step ends on a summary of everything given, and says so out loud.",
];
