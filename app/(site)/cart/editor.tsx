"use client";

import { Editor, type KeyboardRow, type Sources } from "@/components/editor";
import type { CartConfig } from "@/registry/cart/react/cart";
import { cartSchema } from "@/registry/cart/schema";
import { renderCartHtml } from "@/registry/cart/vanilla/render";

const keyboard: KeyboardRow[] = [
  [["Tab", "Shift + Tab"], "Move through each line: quantity, remove, then on to the totals and checkout."],
  [["Enter", "Space"], "Press the focused button: minus, plus, remove or checkout."],
  [["Esc"], "Close the drawer, if you are using the drawer layout."],
];

const checklist = [
  "Screen reader: changing a quantity or removing a line is announced once, with the new subtotal.",
  "Every minus, plus and remove button names its line, so they are not all just 'Remove'.",
  "Totals are worked out in the page, not read from an image: check them against the line prices.",
  "Drawer: focus moves into it, stays inside while it is open, and returns to the basket button on close.",
  "Removing the last line shows the empty message and stops checkout from being pressed.",
  "Browser zoom at 200%: line prices stay beside their lines instead of overlapping.",
  "On a real iPhone in Safari: the quantity box opens a number keypad and the buttons are easy to tap.",
];

export function CartEditor({ initialConfig, sources }: { initialConfig: CartConfig; sources: Sources }) {
  return (
    <Editor
      slug="cart"
      schema={cartSchema}
      initialConfig={initialConfig}
      sources={sources}
      keyboard={keyboard}
      checklist={checklist}
      vanillaHtml={(config) => renderCartHtml(config as unknown as CartConfig)}
    />
  );
}
