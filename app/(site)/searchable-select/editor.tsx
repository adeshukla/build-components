"use client";

import { Editor, type KeyboardRow, type Sources } from "@/components/editor";
import type { SearchableSelectConfig } from "@/registry/searchable-select/react/searchable-select";
import { searchableSelectSchema } from "@/registry/searchable-select/schema";

const keyboard: KeyboardRow[] = [
  [["Down arrow"], "Open the list. Opened already: move to the next option."],
  [["Up arrow"], "Move to the previous option, or open the list at the last one."],
  [["Alt + Down arrow"], "Open the list without moving to an option."],
  [["Enter"], "Choose the highlighted option."],
  [["Escape"], "Close the list. Closed already: clear the field."],
  [["Tab"], "Close the list and move on. The field keeps what you typed."],
  [["Any character"], "Filter the list, with matching text highlighted, and announce how many results are left."],
];

const checklist = [
  "Screen reader (NVDA or Narrator): the field reads its label and says it's a combobox.",
  "Type a few letters: the number of results is announced without moving focus.",
  "Arrow through the options: each option is read out as it's highlighted.",
  "Choose an option: the field updates and the list closes.",
  "Type something with no matches: the message is shown and announced.",
  "Type a word that isn't an option, then Tab: the error explains what to do.",
  "Browser zoom at 200%: the list stays usable and doesn't cover the field.",
  "On a real iPhone in Safari: the list scrolls and options are easy to tap.",
];

export function SearchableSelectEditor({
  initialConfig,
  sources,
}: {
  initialConfig: SearchableSelectConfig;
  sources: Sources;
}) {
  return (
    <Editor
      slug="searchable-select"
      schema={searchableSelectSchema}
      initialConfig={initialConfig}
      sources={sources}
      keyboard={keyboard}
      checklist={checklist}
    />
  );
}
