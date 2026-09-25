import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Enter", ","], "Add what has been typed as a tag."],
  [["Backspace"], "In an empty field: remove the last tag."],
  [["Tab"], "Move from the field to each tag's remove button."],
];

export const checklist = [
  "Screen reader: each tag's remove button is named “Remove CSS”, not just “remove”.",
  "Adding and removing are announced once each, with how many are now added.",
  "Leaving the field keeps what was typed instead of throwing it away.",
  "The hint says how to add a tag; Enter is not discoverable on its own.",
  "The limit is said in words before and after it is reached, not enforced silently.",
  "Each remove button is at least 24px.",
];
