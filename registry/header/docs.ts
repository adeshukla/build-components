import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "First stop is the skip link, then the logo, the links, and the call to action."],
  [["Enter", "Space"], "On the menu button: open or close the small-screen menu."],
  [["Escape"], "Close the menu and put focus back on the menu button."],
  [["Enter"], "Follow the focused link. Choosing a link also closes the menu."],
];

export const checklist = [
  "Narrow the window until the menu button appears: the links move into the menu, nothing is lost.",
  "Screen reader: the header is announced as a banner and the menu button says whether it is expanded.",
  "Open the menu, then press Escape: it closes and focus is back on the button.",
  "Tab from the very top of the page: the skip link appears and jumps past the navigation.",
  "The current page link is marked (it uses the browser address, so check it on a real page).",
  "On a real iPhone in Safari: the menu opens, links are easy to tap, and nothing sits under the notch.",
];
