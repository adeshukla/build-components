import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Move to each end. Two ends means two stops, which is what lets a keyboard set both."],
  [["←", "→"], "Move that end by one step."],
  [["Home", "End"], "Send that end to its own limit — which is the other end, not the scale's end."],
];

export const checklist = [
  "Two native range inputs, one per end, each with its own visible label and its own form value: a keyboard can reach both, which a single overlapping pair of thumbs makes very hard.",
  "aria-valuetext carries the formatted value (£320), so a screen reader says the price rather than the number 320.",
  "The ends clamp each other and never swap, so the one being dragged keeps its meaning all the way to the stop.",
  "The filled bar is aria-hidden: it is a picture of numbers the two sliders already announce.",
  "Each slider is 44px tall, which is the target size the thumb needs on a phone.",
  "Numbers are grouped by hand, never by locale, so the server and the browser agree.",
];
