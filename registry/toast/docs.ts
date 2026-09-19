import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Enter", "Space"], "Press a trigger to show a message. In your project your own code calls this."],
  [["Tab"], "Reach the action and the close button inside a message."],
];

export const checklist = [
  "Screen reader: a new message is read out without moving focus, because the live region is already in the page.",
  "The two trigger buttons are the demo: in your project you call the same function from your own code.",
  "A message that clears itself pauses while the pointer or the keyboard is inside the stack.",
  "Set the time on screen to 0 for anything a visitor must act on: nothing important should vanish.",
  "Colour is never the only signal: the words say what happened as well as the icon.",
  "At 320px wide the stack fits the screen and does not cover the page behind it.",
  "On a real iPhone in Safari: messages appear clear of the home indicator and can be closed by tapping.",
];
