import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Reaches the email, phone and map links in order."],
  [["Enter"], "Opens a new message, calls the number, or opens the map."],
];

export const checklist = [
  "Screen reader: each detail is announced with its label (Email, Phone, Address, Opening hours).",
  "On a phone: tapping the number offers to call it; tapping the email opens a new message.",
  "The address is real: the placeholder says [TODO] so none ships by mistake.",
  "Browser zoom at 200%: long email addresses wrap instead of scrolling sideways.",
];
