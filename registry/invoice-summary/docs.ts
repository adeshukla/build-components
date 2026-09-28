import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Nothing to stop on: it is a table of numbers, not a form."],
];

export const checklist = [
  "Every amount and every total is worked out from the lines, never typed in, so the numbers on the page always add up.",
  "The sums are done in whole pennies. In floating point 0.1 + 0.2 is 0.30000000000000004, which is how invoices end up a penny out.",
  "Money is written out by hand rather than by locale, so the server and the browser produce the same string and hydration does not mismatch.",
  "Each line's description is a th with scope=\"row\", which is what makes a screen reader say the item's name alongside each of its numbers.",
  "The totals are a real tfoot, so they are part of the table rather than loose text underneath it.",
  "The tax rate is in its own label — VAT at 20% — so the number is never unexplained.",
  "Numbers are right-aligned and tabular, which is what lets the eye compare them down the column.",
  "On a narrow screen the columns are kept and the description wraps: stacking an invoice destroys the one comparison it exists for.",
];
