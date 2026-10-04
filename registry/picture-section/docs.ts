import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [[["Tab"], "Nothing in it takes focus: it is a picture and its caption."]];

export const checklist = [
  "Screen reader: the picture is described by what it shows, and the caption is read with it.",
  "A decorative picture has an empty description, so it is skipped.",
  "The picture is not the only place important text appears.",
  "Browser zoom at 200%: the picture scales down and nothing scrolls sideways.",
];
