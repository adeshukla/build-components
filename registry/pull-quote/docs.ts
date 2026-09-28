import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "One stop, and only when the source is a link."],
];

export const checklist = [
  "A figure holding a blockquote and a figcaption. The attribution is in the caption, not inside the blockquote — putting it there makes the speaker's own name part of what they said.",
  "cite on the blockquote is a URL, which is not the same thing as the visible source line. Most markup gets these two the wrong way round.",
  "The <cite> element wraps the work, not the person. A name in a <cite> is the commonest mistake in quoted markup.",
  "The quotation marks are aria-hidden: a screen reader already announces a blockquote as a quote, and a stray left double quotation mark read aloud is noise.",
  "text-wrap: balance, so a large quotation does not leave one word on the last line.",
  "The accent rule is decoration on the figure, not a character in the text, so it never ends up in a copy and paste.",
  "No JavaScript at all.",
];
