import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [[["Tab"], "Reach the actions. The icon is decorative and is skipped."]];

export const checklist = [
  "Screen reader: the heading is read at the level that follows the one above it, and the icon is skipped.",
  "The message says what to do next, not just that something is missing.",
  "An empty state after a search or filter says what was searched for, so it doesn't read as “nothing exists”.",
  "It is a result, not an error: keep it calm, and keep the way back obvious.",
  "Move focus here only if it replaces something the visitor was using; otherwise leave focus alone.",
];
