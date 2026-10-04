import { expect, test } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["text-section"].variants);

for (const target of targets("text-section")) {
  test.describe(`text section — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("a landmark named by its heading; the line above it is not a heading; a blank line starts a paragraph", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("region", { name: "Every project in one place" })).toBeVisible();
      await expect(page.getByRole("heading", { level: 2, name: "Every project in one place" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Why we built it" })).toHaveCount(0);
      await expect(page.locator("section p").filter({ hasText: /Small teams|Northwind keeps/ })).toHaveCount(2);
      await expect(page.getByRole("link", { name: "Read how it works" })).toHaveAttribute("href", "/how-it-works");
    });

    test("centred variant: H3, no link, no line above", async ({ page }) => {
      await open(page, target.url("centred"));
      await expect(page.getByRole("heading", { level: 3 })).toBeVisible();
      await expect(page.locator("section a")).toHaveCount(0);
      await expect(page.getByText("Why we built it")).toHaveCount(0);
    });
  });
}
