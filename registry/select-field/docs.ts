import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Reach the select."],
  [["↑ ↓"], "Change the choice, or open the list, depending on the browser."],
  [["A–Z"], "Jump to the first option starting with that letter — free with a native select."],
];

export const checklist = [
  "It is a native select on purpose: the phone shows its own picker, type-ahead works, and there is nothing to keep in sync.",
  "The label is a real label tied to the select, and “(needed)” is in the label rather than a red asterisk on its own.",
  "The first option is empty with a prompt, so the field starts genuinely unanswered instead of defaulting to the first yard.",
  "Groups are optgroups, which screen readers announce as you move between them.",
  "The error is an alert, sets aria-invalid, joins the field's description while it shows, and takes focus back to the select.",
  "44px tall at both sizes, so it is comfortable on a phone.",
  "No custom listbox: if you need search or multi-select, that is the searchable select or the multi-select instead.",
];
