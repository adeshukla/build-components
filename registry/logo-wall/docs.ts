import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "One stop per entry, and only for the ones that link somewhere."],
];

export const checklist = [
  "A list, so a screen reader counts the entries rather than meeting an undifferentiated row of pictures.",
  "Each alt is the name — \"Tailwind CSS\" — never \"Tailwind CSS logo\". A screen reader already says \"image\"; adding \"logo\" says it twice.",
  "With no image, the name is set as text. A wordmark is a picture of a name, and the name is what anyone actually needs.",
  "Greyscale is applied with a filter, so it changes how the mark looks and never what it is called.",
  "The heading can be a paragraph instead, for a quiet label that should not appear in the page's outline.",
  "Each entry is at least 64px tall and each link at least 44px, so the row is usable with a thumb.",
  "The default names are the tools this page is built with, which is a claim about us. A \"trusted by\" wall is a claim about someone else: only put a name there with their permission, and use their own mark rather than a look-alike.",
  "No JavaScript at all.",
];
