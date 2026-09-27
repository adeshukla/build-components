import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Inside the sheet only: it is a modal dialog, so the page behind it is out of reach."],
  [["Enter", "Space"], "On the handle, step to the next height, wrapping back to the shortest."],
  [["↑", "↓"], "On the handle, one height taller or shorter."],
  [["Home", "End"], "On the handle, shortest or tallest."],
  [["Esc"], "Close the sheet. Focus goes back to the button that opened it."],
];

export const checklist = [
  "The handle is a real button with a name in words, not a decorative bar. Dragging is the extra; the heights have to be reachable by anyone on a keyboard, and by anyone whose hands do not do fine drags.",
  "The height it is at is said in words in a polite status. A bar that has moved is not a message.",
  "It is a native modal dialog, so the browser traps focus and makes the page behind it inert — none of that is hand-rolled.",
  "Escape is handled rather than left to the browser, so focus returns to the button that opened it; Safari does not focus a clicked button, so the opener is passed in rather than read from the document.",
  "On a wide screen it can become an ordinary centred dialog. A sheet stuck to the bottom of a desktop window is a phone pattern in the wrong place.",
  "Every control in it is 44px tall, and the two actions wrap rather than squeezing.",
  "Dragging uses pointer events, so a mouse, a pen and a finger all work; nothing depends on touch events alone.",
];
