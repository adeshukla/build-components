import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Move between the two buttons; focus cannot leave the warning."],
  [["Enter", "Space"], "Stay signed in, or sign out now."],
  [["Escape"], "Counts as staying signed in, never as signing out."],
];

export const checklist = [
  "Focus goes to the stay button on open and back where it came from on close — the warning arrives unasked, so it must not lose someone's place.",
  "Escape means stay: the destructive reading of a dismissed dialog would sign people out for pressing the wrong key.",
  "The ticking clock is aria-hidden; a live region would read every second.",
  "The time left is announced at 30, 20, 10 and 5 seconds, which is enough to act on without talking over anyone.",
  "The countdown is generous: WCAG 2.2.1 wants a way to extend the time, which the stay button is.",
  "Activity puts the clock back, so nobody is warned while they are still working.",
  "The time is written by hand as m:ss, never by Intl, so the server and the browser agree.",
];
