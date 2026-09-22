import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Move between the fields. Spaces and the slash are added for you; type digits only."],
  [["Enter"], "Submit. The first field with a problem gets focus, with its message read out."],
];

export const checklist = [
  "Real payments: card numbers must reach your payment provider without touching your server. Use the provider's hosted fields or checkout, and treat this part as the interface pattern to match.",
  "Browsers and password managers offer to fill the card (autocomplete cc-number, cc-exp, cc-csc).",
  "Screen reader: each field reads its label, its hint (MM/YY, where the code is) and, after a mistake, its error.",
  "The card type is named in words next to the number, and the security code hint changes for American Express.",
  "On a phone, the number keypad opens for the number, expiry and code.",
  "Editing in the middle of the number keeps the caret where you were typing.",
  "Try the test number 4242 4242 4242 4242 with any future date: it passes the checksum.",
];
