import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Enter", "Space"], "On the value: start editing. Focus moves into the field."],
  [["Enter"], "In a one-line field: save."],
  [["Escape"], "Cancel and go back to the value, unchanged."],
  [["Tab"], "Reach Save and Cancel."],
];

export const checklist = [
  "Screen reader: the button reads “Harbour redesign, Edit Project name, currently Harbour redesign” — never a bare “Edit”.",
  "Saving and cancelling are each announced, and focus returns to the button both times.",
  "Escape cancels without saving, and the old value comes back.",
  "An empty required value is explained and keeps focus in the field.",
  "Nothing is saved to your server here: hook up the save event and show a failure if it doesn't work.",
  "With several lines, Enter makes a new line and only Save saves.",
];
