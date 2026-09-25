import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [[["Tab"], "Nothing to operate: a countdown is text that changes."]];

export const checklist = [
  "The ticking digits are aria-hidden: a live region that changes every second is unusable with a screen reader.",
  "What is said out loud changes only when the coarse reading does — once a minute, not once a second.",
  "The time left is worked out in the browser, so nothing is rendered on the server that would already be wrong.",
  "Until the browser has worked it out there is a line saying so, rather than a flash of zeros.",
  "The end state replaces the digits with a sentence, and that sentence is announced.",
  "Nothing here is a deadline you cannot extend: if a countdown gates a task, WCAG 2.2.1 wants a way to get more time.",
  "Units are written by hand (“1 day”, “2 days”), never by Intl, which disagrees between server and browser.",
];
