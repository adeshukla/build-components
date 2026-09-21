import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Focus the choose button, then each attached file's remove button."],
  [["Enter", "Space"], "Open the file picker, or remove the focused file."],
];

export const checklist = [
  "Screen reader: the button is announced as a file input with the label and the hint.",
  "Dropping is a shortcut: everything can be done with the button and the keyboard alone.",
  "Attaching and removing a file is announced, with how many are attached now.",
  "A file that is the wrong kind or too big is refused with a message that says which file and why.",
  "The same checks run on dropped files: a drop ignores the accept list.",
  "Each remove button names its file, so they are not five identical crosses.",
  "On a real iPhone in Safari: the picker offers the camera and the photo library as expected.",
];
