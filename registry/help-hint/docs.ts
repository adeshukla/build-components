import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "To the help button, then into the field. The help is not a stop; it is text."],
  [["Enter", "Space"], "Open or close the help. It stays open until it is closed again."],
];

export const checklist = [
  "A disclosure, not a tooltip. Help that has to be hovered cannot be read twice, cannot be copied from, vanishes the moment the pointer moves, and barely exists on a touch screen.",
  "aria-expanded on the button says whether the help is open, and aria-controls says what it opens.",
  "While it is open, the help joins the field's aria-describedby, so it is read as part of the question rather than as loose text elsewhere on the page.",
  "The short hint is always visible. Hiding everything behind a question mark makes people hunt for what they needed before they started.",
  "The button is named in words — Help with this answer. A lone question mark is not a name, and the ? glyph is aria-hidden.",
  "The example is a separate described-by line, so it is read after the label rather than mixed into the hint.",
  "No placeholder by default: a placeholder is gone as soon as anyone types, which is exactly when the example is wanted.",
  "The button is 44px tall and the help is plain text that reflows at 320px and at 200% zoom.",
];
