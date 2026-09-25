import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Move to each group of options, then to the add button."],
  [["← → ↑ ↓"], "Move through the options in a group, skipping the ones out of stock."],
  [["Space"], "Pick the option you are on."],
];

export const checklist = [
  "Each group is a fieldset with a legend, so “M” is announced as a Size rather than on its own.",
  "Options are real radios: the arrow keys work, and only one per group can be picked, without any script.",
  "Out of stock options are disabled and say so in words — a dashed border alone tells nobody.",
  "Add to bag is really disabled until every group has a pick, and a status line says which group is missing.",
  "Adding says what was added, including the options, because the button does not change.",
  "The price is printed as entered: no currency formatting that would differ between server and browser.",
  "Every option is 44px tall, so a colour chip is still a comfortable target on a phone.",
];
