import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "One stop, and only when the name is a link. Everything else here is text."],
];

export const checklist = [
  "Not an <address> element. That is for the contact details of the nearest article or of the page; a byline on its own is neither, and using it makes a landmark out of a sentence.",
  "The author link carries rel=\"author\", which says what the link is rather than leaving it as \"a link with a person's name in it\".",
  "The initials circle is aria-hidden: the name is right beside it, so the circle is decoration whatever it contains.",
  "Both dates are said — published and updated — because replacing one with the other hides a fact people look for.",
  "Both are real time elements with machine-readable dates, written out in full and formatted by hand so the server and the browser agree.",
  "The separating dots are aria-hidden, so a screen reader does not read \"middle dot\" between every fact.",
  "The link is 4.5:1 against the surface and underlined, so it is not identified by colour alone.",
  "No JavaScript at all.",
];
