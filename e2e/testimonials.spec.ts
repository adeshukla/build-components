import { expect, test } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.testimonials.variants);

for (const target of targets("testimonials")) {
  test.describe(`testimonials — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("a list of quotations, each with who said it", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("heading", { level: 2, name: "What people say" })).toBeVisible();
      await expect(page.locator("section li")).toHaveCount(3);
      await expect(page.locator("figure blockquote")).toHaveCount(3);
      await expect(page.locator("figure figcaption")).toHaveCount(3);
    });

    test("nobody is invented: every default quote, name and role is a [TODO]", async ({ page }) => {
      await open(page, target.url("default"));
      const texts = await page.locator("blockquote, figcaption span").allInnerTexts();
      expect(texts.length).toBe(9);
      for (const text of texts) expect(text).toMatch(/^\[TODO:/);
    });
  });
}
