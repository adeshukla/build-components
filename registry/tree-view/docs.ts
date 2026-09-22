import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["↓", "↑"], "Move to the next or previous item you can see."],
  [["→"], "Open a closed folder; on an open one, move to its first item."],
  [["←"], "Close an open folder; otherwise move to the folder it is in."],
  [["Home", "End"], "Jump to the first or last item you can see."],
  [["Enter", "Space"], "Select the item."],
  [["*"], "Open every folder at the same level."],
  [["a–z"], "Jump to the next item starting with that letter."],
];

export const checklist = [
  "Screen reader: the tree is announced with its name; each item reads its name, level, position (e.g. 2 of 4) and, for folders, open or closed.",
  "Tab enters the tree once, on the last item you were on, and the next Tab leaves it.",
  "Opening and closing folders with the arrow keys never loses focus.",
  "The selected item is shown by more than colour (weight as well as a tint).",
  "Windows High Contrast / forced colours: the focused item is still outlined.",
  "Phone width: long names are cut with an ellipsis instead of pushing the tree off the screen.",
];
