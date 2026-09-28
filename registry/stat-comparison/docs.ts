import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Nothing to stop on: it is a table of facts, not a set of controls."],
];

export const checklist = [
  "Which one is better is said in words as well as shaded. A tinted cell is invisible to a screen reader and to anyone who cannot tell the two shades apart (WCAG 1.4.1).",
  "The measure is a th with scope=\"row\", so a screen reader says \"Files to copy, 1\" rather than reading a bare number out of context.",
  "The first header can be blank to the eye but is never blank in the markup: it is the corner of the table, and an empty th leaves the column headers unanchored.",
  "The note says that better depends on the project. A comparison table that declares a winner without saying on what terms is marketing, not information.",
  "Values are tabular and left-aligned with their headers, so the eye compares down the column.",
  "A row can be marked as neither: not every measure has a winner, and pretending otherwise is the commonest dishonesty in this pattern.",
  "Put real numbers in. An invented comparison is worse than no comparison.",
  "At a narrow width the columns are kept and the measure wraps, because the comparison is the whole point of the table.",
  "No JavaScript at all.",
];
