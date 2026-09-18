"use client";

import { Editor, type KeyboardRow, type Sources } from "@/components/editor";
import type { DatePickerConfig } from "@/registry/date-picker/react/date-picker";
import { datePickerSchema } from "@/registry/date-picker/schema";

const keyboard: KeyboardRow[] = [
  [["Enter", "Space"], "On the calendar button: open the calendar. On a day: pick it."],
  [["Left arrow", "Right arrow"], "Previous or next day."],
  [["Up arrow", "Down arrow"], "Same day in the previous or next week."],
  [["Home", "End"], "First or last day of the week."],
  [["Page Up", "Page Down"], "Previous or next month."],
  [["Shift + Page Up", "Shift + Page Down"], "Previous or next year."],
  [["Enter"], "On the month and year heading: pick a year, then a month."],
  [["Escape"], "In the year or month view: back to the days. Otherwise: close and return to the calendar button."],
  [["Tab", "Shift + Tab"], "Move between the heading buttons and the calendar. Focus stays inside."],
];

const checklist = [
  "Screen reader (NVDA or Narrator): the field reads its label and the date format.",
  "Open the calendar: the focused day is read with its weekday and full date.",
  "Month and year heading: the year and month views are announced and easy to follow.",
  "Escape closes the calendar and focus returns to the calendar button.",
  "Type an invalid date and press Tab: the error is read out and shown under the field.",
  "With earliest and latest dates set, days outside the range look disabled and can't be picked.",
  "Browser zoom at 200%: nothing overlaps or is cut off.",
  "On a real iPhone in Safari: open the calendar, pick a date, and scroll with the calendar open.",
];

export function DatePickerEditor({ initialConfig, sources }: { initialConfig: DatePickerConfig; sources: Sources }) {
  return (
    <Editor
      slug="date-picker"
      schema={datePickerSchema}
      initialConfig={initialConfig}
      sources={sources}
      keyboard={keyboard}
      checklist={checklist}
    />
  );
}
