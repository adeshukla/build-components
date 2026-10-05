import { expect, test } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["product-grid"].variants);

for (const target of targets("product-grid")) {
  test.describe(`product grid — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("each product is an article: a name one level down that links, then its price and note", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("article")).toHaveCount(4);
      const first = page.getByRole("article").first();
      await expect(first.getByRole("heading", { level: 3 })).toHaveText("Deck jacket");
      await expect(first.getByRole("link", { name: "Deck jacket" })).toHaveAttribute("href", "/shop/deck-jacket");
      // The price and the note are read as separate words.
      await expect(first.getByRole("paragraph")).toHaveText("£128 New");
      // With no picture set, the frame is decoration: there is no image to describe.
      await expect(first.getByRole("img")).toHaveCount(0);
    });

    test("pictures variant: a set picture is described; an unsafe address is never loaded", async ({ page }) => {
      await open(page, target.url("pictures"));
      await expect(page.getByRole("heading", { level: 4 })).toHaveCount(2);
      await expect(page.getByRole("article").first().locator("img")).toHaveAttribute("alt", "The Build Components mark, standing in for a photo");
      await expect(page.locator('img[src^="javascript"]')).toHaveCount(0);
      await expect(page.getByRole("article").nth(1).locator("img")).toHaveCount(0);
    });
  });
}
