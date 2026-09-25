import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Move between the field, Save and the leave button."],
  [["Enter", "Space"], "Press a button; leaving with unsaved text opens the dialog."],
  [["Escape"], "In the dialog, keep editing — the safe choice, never discard."],
];

export const checklist = [
  "The dialog only appears while there is something to lose, so nobody is nagged about an untouched form.",
  "Escape keeps editing: making it discard would throw work away on a mis-typed key.",
  "Focus goes to Keep editing on open and back to the leave button afterwards.",
  "The unsaved state is in a status line that changes once, not on every keystroke.",
  "beforeunload covers closing the tab; the browser writes that wording and will not let you change it.",
  "Wire the leave button to whatever navigates in your app — a router push, a link, a tab change.",
];
