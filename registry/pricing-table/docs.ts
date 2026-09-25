import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Reach the billing choice, then each plan's button."],
  [["← →"], "Switch between monthly and yearly, as in any radio group."],
  [["Enter", "Space"], "Choose that plan."],
];

export const checklist = [
  "The billing cycle is a radio group, not a switch: two named choices, each reachable with the arrow keys.",
  "Changing the cycle changes every price at once, so a status line says which prices are showing.",
  "Each button says which plan it chooses (“Choose Crew”), so the buttons are not five identical “Choose”s in a row.",
  "The highlighted plan carries a badge in words as well as a colour and a border.",
  "Plans are a list of headings, so a screen reader can jump plan to plan.",
  "Prices are printed exactly as entered — no discount is invented, and nothing is worked out by Intl.",
  "At 320px wide the three plans stack and every button is still 44px tall.",
];
