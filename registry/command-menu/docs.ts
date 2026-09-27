import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Ctrl", "K"], "Open it from anywhere on the page. ⌘K on a Mac. Pressing it again closes it."],
  [["Type"], "Narrow the list. Every word has to match, in any order, so \"copy react\" finds \"Copy the React file\"."],
  [["↓", "↑"], "Move the highlighted command. The field keeps the focus; it is aria-activedescendant that moves."],
  [["Home", "End"], "First or last command in the whole list, across the group headings."],
  [["Enter"], "Run the highlighted command."],
  [["Esc"], "Close it. Focus goes back to the button it came from."],
];

export const checklist = [
  "A combobox over a listbox, not a list of buttons: the field keeps focus and aria-activedescendant moves, which is what tells a screen reader the highlighted row without stealing the typing.",
  "The groups are role=group with their own heading inside the listbox, so the headings are announced but are not stops the arrows have to walk through.",
  "The arrows walk one flat list across the groups, so the highlighted row and aria-activedescendant can never disagree.",
  "The pointer sets the highlighted row too. Two separate ideas of \"active\" is the bug every palette ships.",
  "It is a native modal dialog, so focus is trapped by the browser and the page behind it is inert.",
  "Escape is handled rather than left to the browser, so focus returns to the button that opened it — Safari does not focus a clicked button, so the opener is passed in rather than read from the document.",
  "Which command ran is announced politely, because a palette that closes silently leaves no evidence it did anything.",
  "The shortcut hints are decoration: every command can be reached by typing its name. A palette that only answers to chords is no help to anyone who cannot press two keys at once.",
  "Every row is 44px tall — a palette is a menu people use on phones too.",
];
