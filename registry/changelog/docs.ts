import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Nothing to stop on: a changelog is text. That is the point — no disclosure to open before it can be read."],
];

export const checklist = [
  "An ordered list of releases, so the order is in the markup and not only in the layout: a screen reader counts them and can jump between the version headings.",
  "Each release has a real heading one level below the section's, so the whole log appears in a document outline.",
  "The kind is a word — Added, Fixed, Removed — not a coloured dot. A colour legend is no use to anyone who cannot tell them apart, and none at all to a screen reader.",
  "Dates are real time elements with a machine-readable date, written out in full: 2026-09-18 is not a date most people read.",
  "Nothing is behind a disclosure. A changelog people have to expand release by release is a changelog nobody reads.",
  "The newest release is marked in words, not by position alone.",
  "No JavaScript at all: the whole thing is markup and CSS.",
  "Dates are formatted by hand, never by locale, so the server and the browser agree.",
];
