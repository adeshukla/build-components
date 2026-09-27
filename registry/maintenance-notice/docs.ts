import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "To the link, then to the dismiss button. It comes first in the page, so it is not missed."],
  [["Enter", "Space"], "Follow the link, or dismiss the notice."],
];

export const checklist = [
  "A region landmark, not a live region. The notice is already on the page when it loads, so a live region would announce nothing — a landmark is findable at any point afterwards.",
  "Sticky, not fixed: it keeps its own space rather than covering the top of the page on a phone.",
  "The window is a real time element with a machine-readable start, and it is written out in full — a bare \"22:00 until 02:00\" is a window nobody can plan around.",
  "It says what will and will not work. \"Scheduled maintenance\" on its own tells nobody whether their work is safe.",
  "Storage throws in a sandboxed frame and in private browsing, so the memory of a dismissal falls back to memory rather than taking the notice down with it.",
  "The dismiss button is named in words and is a 44px square; × alone is not a name.",
  "Change the storage key for a new notice, or last month's dismissal hides this month's.",
  "Dates are written by hand, never by locale, so the server and the browser agree.",
];
