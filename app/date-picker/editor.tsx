"use client";

import { Editor, type Sources } from "@/components/editor";
import { DatePicker, type DatePickerConfig } from "@/registry/date-picker/react/date-picker";
import { datePickerSchema } from "@/registry/date-picker/schema";

const checklist = [
  "Screen reader (NVDA or Narrator): the field announces its label and the date format.",
  "Open the calendar with Enter on the calendar button: the focused day is read with weekday and full date.",
  "Arrow keys, Home/End and PageUp/PageDown move focus; the new month is announced.",
  "Escape closes the calendar and focus returns to the calendar button.",
  "Type an invalid date and press Tab: the error is announced and shown under the field.",
  "With earliest/latest dates set, days outside the range look disabled and can't be picked.",
  "Browser zoom at 200%: nothing overlaps or is cut off.",
  "Phone width, and scrolling while the calendar is open: it stays attached to the field and on screen.",
  "Submit the test form: values are ISO dates (YYYY-MM-DD) under the form field name.",
];

export function DatePickerEditor({ initialConfig, sources }: { initialConfig: DatePickerConfig; sources: Sources }) {
  return (
    <Editor
      slug="date-picker"
      schema={datePickerSchema}
      initialConfig={initialConfig}
      sources={sources}
      checklist={checklist}
      renderPreview={(config) => <DatePicker config={config as DatePickerConfig} />}
    />
  );
}
