import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "In and out of the whole bar. One stop, not one per menu — that is the point of a menubar."],
  [["←", "→"], "Between the menus. If one is open, moving sideways opens the next one as it arrives."],
  [["↓", "Enter", "Space"], "Open the menu you are on and land on its first item."],
  [["↑"], "Open it and land on its last item."],
  [["↓", "↑"], "Inside a menu, move between its items, wrapping at both ends."],
  [["Home", "End"], "First or last — of the menus on the bar, or of the items inside an open menu."],
  [["A", "–", "Z"], "Jump to the next item in the open menu starting with that letter."],
  [["Esc"], "Close the open menu. Focus goes back to the menu's own button."],
];

export const checklist = [
  "One tab stop for the whole bar, with a roving tabindex inside it: nine menu items should not be nine stops on the way to the page's content (WAI-ARIA APG Menubar).",
  "Sideways from inside an open menu moves to the next menu and opens it, which is how every desktop menu bar has worked for forty years.",
  "Type-ahead: a letter jumps to the next item starting with it, so a long menu does not have to be arrowed through.",
  "aria-expanded on each menu's button says whether it is open, and aria-haspopup says there is something to open.",
  "Escape and outside clicks are heard on the document, not on the component's root — Safari does not focus a button when it is clicked, so a root listener never hears the key.",
  "Escape gives focus back to the button that opened the menu, never to the page.",
  "Tab from inside an open menu closes the bar and leaves, rather than walking the items.",
  "Which item was chosen is announced politely; a menu that closes silently leaves no evidence.",
  "Every menu button and item is 44px tall, and the bar wraps rather than scrolling sideways on a phone.",
];
