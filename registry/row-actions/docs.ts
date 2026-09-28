import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Along each row's actions, then on to the next row."],
  [["Enter", "Space"], "Run that action on that row."],
];

export const checklist = [
  "Every button is named with the row it belongs to — \"Delete Churn by cohort\" — because nine buttons all called Delete is exactly what a screen reader would otherwise list.",
  "The row's name is a th with scope=\"row\", which is what lets a screen reader say the record's name alongside each cell it reads.",
  "The actions column has a real header. An empty header cell leaves the column unexplained in the table's own structure.",
  "What was done is said in a polite status, naming both the action and the row.",
  "The destructive action is last and coloured, but it is still named in words: colour is never the only difference.",
  "Every action is 44px tall, and the actions wrap rather than overflowing the cell on a phone.",
  "For a row with more than three or four actions, put them behind the dropdown menu part instead — a row of eight buttons is eight tab stops per row.",
];
