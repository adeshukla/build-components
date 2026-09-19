"use client";

import { Editor, type KeyboardRow, type Sources } from "@/components/editor";
import type { FormConfig } from "@/registry/form/react/form";
import { formSchema } from "@/registry/form/schema";
import { renderFormHtml } from "@/registry/form/vanilla/render";

const keyboard: KeyboardRow[] = [
  [["Tab", "Shift + Tab"], "Move between the fields in reading order."],
  [["Space"], "Tick or untick a checkbox, or open a choice list."],
  [["Enter"], "In a single-line field: send the form."],
  [["Enter"], "On an error summary link: jump to the field that needs fixing."],
];

const checklist = [
  "Submit an empty form: the summary lists every problem and focus moves to it.",
  "Screen reader: each error is read with its field, and starts with the word Error.",
  "Follow a link in the summary: focus lands on the field it names.",
  "Fix a field and watch the message disappear as you type.",
  "Submit a valid form: the success message is announced, not just shown.",
  "Check every rule you set here matches what your back end accepts: they are two separate gates.",
  "A custom pattern needs a hint that says the format in words, or the message cannot explain itself.",
  "On a real iPhone in Safari: the right keyboard appears for email and phone fields.",
];

export function FormEditor({ initialConfig, sources }: { initialConfig: FormConfig; sources: Sources }) {
  return (
    <Editor
      slug="form"
      schema={formSchema}
      initialConfig={initialConfig}
      sources={sources}
      keyboard={keyboard}
      checklist={checklist}
      vanillaHtml={(config) => renderFormHtml(config as unknown as FormConfig)}
    />
  );
}
