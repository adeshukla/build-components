import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [[["—"], "Nothing to focus: a skeleton is a placeholder, never a control."]];

export const checklist = [
  "Screen reader: hears “Loading comments” once, not a list of empty boxes (the shapes are hidden from it).",
  "Replace the skeleton with the real content in the same place, so focus and reading position survive.",
  "With reduced motion on, the sheen stops.",
  "Keep the shapes close to the real content's size, or the page jumps when it arrives.",
  "For a wait longer than a few seconds, say so in words as well (“Still loading…”).",
  "If loading fails, replace this with a message and a way to try again — never leave the skeleton up.",
];
