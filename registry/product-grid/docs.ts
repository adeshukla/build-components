import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Moves from product to product: each card is one link, named by the product."],
  [["Enter"], "Opens the product."],
];

export const checklist = [
  "Screen reader: the products are a list, each an article whose name is a heading and a link, followed by its price.",
  "Each picture that shows the product has alt text saying what it shows; a picture left empty is a plain frame and is skipped.",
  "The heading levels fit the page: the section's heading, then each product one level below.",
  "Browser zoom at 200%: the cards stack into fewer columns, then one.",
];
