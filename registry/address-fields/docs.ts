import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Down the block in the order an address is written."],
  [["↑", "↓"], "Change the country, which relabels the postcode field and adds or removes the region field."],
];

export const checklist = [
  "Every field carries the autocomplete token for its own purpose — address-line1, address-level2, postal-code, country — which is what lets a browser or a password manager fill the whole block at once (WCAG 1.3.5 Identify Input Purpose, AA).",
  "The postcode field is called what that country calls it: Postcode, Eircode, ZIP code. A single label is wrong for most of the world.",
  "A region field appears only for countries that have one, rather than asking a German address for a state.",
  "The country comes first by default, so the labels below it are right before they are read. Turn it off if your form puts the country last.",
  "The change of country is said in a polite status line, because relabelling a field silently is a change nobody is told about.",
  "Nothing is a combobox that did not need to be: the country is a native select, so the phone's own wheel and type-ahead work.",
  "Every field is 44px tall and the block is one column, which is what an address is.",
];
