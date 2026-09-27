import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "From the very top of the page, the first thing focused is the first skip link, which appears as it takes focus."],
  [["Enter"], "Jump to that landmark. Focus lands there, so the next Tab carries on from inside it."],
];

export const checklist = [
  "The links are hidden by size — position, 1px and clip-path — never by display:none or visibility:hidden, both of which take them out of the tab order, which is the one place a skip link has to be.",
  "They come first in the source, before the logo: a skip link after the navigation has nothing left to skip.",
  "Each target carries tabindex=\"-1\" and takes focus. A link that only scrolls leaves the keyboard in the header it just skipped, so the next Tab goes straight back into it (WCAG 2.4.1 Bypass Blocks).",
  "Each link is 44px tall once shown, and its focus ring is not clipped by the header it sits in.",
  "The label names the destination — Skip to main content — not just \"Skip\".",
  "They can be shown permanently instead, which some teams prefer; the tab order is the same either way.",
];
