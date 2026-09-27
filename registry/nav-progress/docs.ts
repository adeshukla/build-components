import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "To the button that starts the stand-in navigation."],
  [["Enter", "Space"], "Start it. The state is announced; the bar is only for the people who can see it."],
];

export const checklist = [
  "The words are the accessible part. A client-side route change gives a screen reader nothing at all by itself, so \"Loading\" and then \"Loaded: Parts catalogue\" in a polite region is the component's real job.",
  "The bar is aria-hidden: it is a picture of the state the live region already carries.",
  "It names the page it arrived at. \"Loaded\" on its own says nothing about where you now are.",
  "Nothing is drawn until the load has outlasted the delay, because a bar that flashes for 80ms reads as a glitch rather than as progress.",
  "No role=progressbar: the component has no idea what fraction is done, and a progressbar with an invented value is a lie. It creeps, and the words say the state.",
  "Under reduced motion the bar is simply present at a fixed width — no creep, no pulse.",
  "The status is polite, never an alert: a page load should not interrupt whatever is being read.",
  "Point start() and finish() at your router's own events; everything else stays as it is.",
];
