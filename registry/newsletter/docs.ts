import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Move between the field, the consent box and the button."],
  [["Enter"], "Submit from the field, as in any form."],
];

export const checklist = [
  "The address is checked in the component, not left to the browser's validation bubble, which disappears and cannot be read back.",
  "The error is an alert; it sets aria-invalid on the field and joins its description only when it is about the field.",
  "A consent problem moves focus to the box rather than to the email field, so focus lands on the thing to fix.",
  "The form stays on the page after signing up and the outcome is said in a status line — replacing the form loses the context.",
  "The label is a real label; the placeholder is empty by default because a placeholder is not a label.",
  "type=email with inputMode and autocomplete, so phones show the right keyboard and browsers can fill it in.",
  "Consent is off by default in the markup: a pre-ticked box is not consent.",
];
