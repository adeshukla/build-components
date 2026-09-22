import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Reach the banner's link and buttons in page order. The banner never grabs focus."],
  [["Enter", "Space"], "Accept all, Reject all, or open the preferences."],
  [["Space"], "In the preferences: turn a cookie type on or off."],
  [["Escape"], "Close the preferences without saving."],
];

export const checklist = [
  "This handles the choice, not the cookies: load analytics or marketing scripts only after their category is true (read localStorage or listen for the cookie-consent event).",
  "Screen reader: the banner is a named region, reachable from the landmarks list.",
  "Reject all is as easy to find and press as Accept all, and nothing is ticked in advance.",
  "After choosing, focus lands on the Cookie settings button instead of disappearing.",
  "The preferences keep focus inside until closed, and each switch reads its description.",
  "Phone width: the banner doesn't cover the whole screen, and its buttons wrap instead of overflowing.",
  "Put the banner early in the page's HTML so keyboard users reach it without tabbing through everything.",
  "Check the wording and the cookie types with whoever owns privacy for the site; this is not legal advice.",
];
