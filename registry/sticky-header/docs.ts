import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Through the header, then into the page. Tabbing back up brings a hidden header back before the focus reaches it."],
  [["Enter"], "On a link, jump to that section. It lands below the header, not underneath it."],
];

export const checklist = [
  "Focus anywhere inside brings the header back. Without it a keyboard moving up the page chases a header that has hidden itself, and the focus ring ends up under a bar nobody asked for.",
  "The scroller carries scroll-padding-top, so a heading jumped to lands below the header rather than beneath it.",
  "Hiding is turned off for anyone who asks for less motion — a bar sliding in and out on every scroll is exactly the kind of movement that setting is for.",
  "Below 400px of height the header stops being sticky altogether. A sticky bar at 200% zoom eats the screen (WCAG 1.4.10 Reflow).",
  "Only a real scroll counts as direction. Shrinking the header shortens the content above it, and the browser nudges the scroll position a few pixels to keep the view still — read as direction, those nudges make the header pop back the instant it shrinks.",
  "Shrinking changes padding and type size only. Nothing is removed, so no control disappears at one scroll position and reappears at another.",
  "The header is a real header element with a named nav inside it, so it is a landmark either way.",
  "Every link and the action are 44px tall even when shrunk; the bar wraps rather than squeezing on a phone.",
];
