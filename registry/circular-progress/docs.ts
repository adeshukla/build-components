import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "To the button that starts the stand-in run. The ring itself is not a control, so it is not a stop."],
];

export const checklist = [
  "A determinate ring carries aria-valuenow, aria-valuemin and aria-valuemax, plus aria-valuetext so a screen reader says \"62% uploaded\" rather than the bare number 62.",
  "An indeterminate ring carries no aria-valuenow at all — that is what indeterminate means in ARIA. Inventing a number, or animating a fake one, is a lie about the state.",
  "The number is printed on the face as well, because a partly filled arc is not information for anyone who cannot compare arcs.",
  "Only completion is announced. A progressbar whose value is read on every tick talks over everything else on the page.",
  "It is named by real text with aria-labelledby, so the ring is never an unlabelled progressbar.",
  "Under reduced motion the indeterminate ring stops turning: the movement says nothing the words do not.",
  "The ring is not focusable and has no role of its own beyond progressbar — it is a readout, not a control.",
];
