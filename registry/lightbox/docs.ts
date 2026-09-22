import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Enter", "Space"], "On a thumbnail: open it in the viewer. Focus moves to Close."],
  [["← →"], "In the viewer: previous or next picture."],
  [["Home", "End"], "In the viewer: first or last picture."],
  [["Tab"], "Move between Close, Previous and Next. Focus stays in the viewer."],
  [["Escape"], "Close the viewer and return to the thumbnail you opened."],
];

export const checklist = [
  "Every picture has a description that says what it shows; decorative detail is left out.",
  "Screen reader: each thumbnail reads as a button with the picture's description; the viewer announces the new position (e.g. 3 of 6) as you move.",
  "Focus returns to the thumbnail of the picture you were on when the viewer closes, not just the one you opened.",
  "The page behind doesn't scroll while the viewer is open.",
  "On a phone: swiping left and right changes picture, and the buttons are big enough to tap.",
  "Large images are sized for the screen (serve a smaller file for thumbnails).",
];
