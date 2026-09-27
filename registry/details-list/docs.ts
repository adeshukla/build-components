import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [[["Tab"], "Move between the change links, if there are any."]];

export const checklist = [
  "It is a description list, so each value stays tied to its label even when the layout collapses on a phone.",
  "Every change link names its row for screen readers — a list of five identical Change links is no use to anyone.",
  "An empty value says so in words rather than leaving a blank nobody can interpret.",
  "Links are checked before they are rendered: only relative, fragment, http(s), mailto and tel addresses survive.",
  "No table: a table would promise columns of data that this is not.",
  "Nothing here needs JavaScript at all.",
];
