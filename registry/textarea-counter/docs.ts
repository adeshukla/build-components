import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [[["Tab"], "Reach the box. Everything else is ordinary typing."]];

export const checklist = [
  "The counter is part of the field's description, so it is read when the field is reached rather than sitting there unexplained.",
  "It is announced only at the marks that matter — the warning point, the limit, going over — because a live counter repeats the whole number for every letter typed.",
  "Going over sets aria-invalid, shows an alert and adds that message to the field's description.",
  "Letting people go over is the default: silently swallowing the end of a pasted sentence is worse than an error they can fix.",
  "The remaining count is in words (“12 characters left”), not just “12/200”, which reads as nonsense out loud.",
  "The hint is a real paragraph tied with aria-describedby, not a placeholder that vanishes as soon as anyone types.",
];
