import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Move through the hide button, the box and Post."],
  [["Enter", "Space"], "Hide or show the thread, or post what is typed."],
];

export const checklist = [
  "Comments are a list, so a screen reader says how many there are before reading them.",
  "A reply is marked in words as well as by its indent, so the shape of the conversation survives without the styling.",
  "Post is really disabled while the box is empty, rather than posting nothing.",
  "After posting, focus stays in the box and a status line says the comment went up — it appears above the box, out of sight.",
  "The hide button carries aria-expanded and points at the list it hides with aria-controls.",
  "New comments say “Just now” rather than a formatted clock reading, which would differ between server and browser.",
  "Nothing is sanitised for you: the text is inserted as text, never as HTML.",
];
