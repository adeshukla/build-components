import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Along the trail, then to the actions. The current page is not a stop, because it is not a link."],
];

export const checklist = [
  "A header element, so it is a landmark on every page it is used on — and it holds the page's one h1, which is the single most useful thing on a page for anyone navigating by heading.",
  "The trail is its own nav with its own name, inside the header. Two navs on a page with no names is a set of landmarks nobody can tell apart.",
  "The current page is the last step and is not a link, because there is nowhere for it to go. It carries aria-current=\"page\".",
  "The separators are aria-hidden, so a screen reader does not read \"slash\" between every step.",
  "The detail is a labelled pair in a description list: \"24 September 2026\" on its own says nothing about what the date is.",
  "There is no eyebrow above the title. A line of small text above an h1 either belongs in the trail or belongs in the lede.",
  "The title uses text-wrap: balance so a long one does not leave a single word on the last line, and clamps rather than jumping between breakpoints.",
  "Every link and action is 44px tall and they wrap rather than squeezing on a phone.",
  "No JavaScript at all.",
];
