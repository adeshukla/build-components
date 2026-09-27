import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Enter", "Space"], "Ask the question. Focus moves into it, so the question is read."],
  [["Tab"], "Between the two answers. Nothing else in the page moves."],
  [["Esc"], "Back out. Focus returns to the button that asked."],
];

export const checklist = [
  "The question replaces the button in its own row rather than opening a dialog. Nothing is covered, and nothing has to be dismissed before the rest of the page works again.",
  "Focus moves into a named group, so the question is announced by the move — no live region has to shout it.",
  "Focus lands on the cancel answer by default, so a stray Enter after the first press does nothing. That is the option to keep for anything destructive.",
  "Escape backs out and returns focus to the button that asked, heard on the document because Safari does not focus a clicked button.",
  "The thing being acted on stays exactly where it was. On a narrow screen the question wraps below it rather than squeezing it, so the row only ever grows downwards — nothing above the pointer moves mid-press.",
  "After the action, focus lands on the row rather than the page body, because the button it was on no longer exists.",
  "The confirm button repeats the verb — Yes, delete — so it makes sense read on its own, out of context.",
  "The outcome is said in a polite status: a row that has quietly changed is not a message.",
];
