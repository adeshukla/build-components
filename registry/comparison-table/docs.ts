import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [[["← →"], "Scroll the table sideways on a narrow screen once it has focus."]];

export const checklist = [
  "Yes and no are printed as words: a bare tick or cross is read out as a stray character, or not at all.",
  "The feature is the row header and each plan the column header, so a screen reader can say Crew, shared boards, yes.",
  "The highlighted column says so in words as well as carrying a tint.",
  "The caption names the table before it is read, rather than leaving a heading above it unconnected.",
  "Three columns at most: past that, a comparison stops being readable on a phone.",
  "No JavaScript: it is a table.",
];
