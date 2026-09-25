import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["back-to-top"].variants);
const button = (page: Page) => page.getByRole("button", { name: "Back to top" });

for (const target of targets("back-to-top")) {
  test.describe(`back to top — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("it stays away until there is something to go back up from", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(button(page)).toBeHidden();
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await expect(button(page)).toBeVisible();
    });

    test("it moves focus to the top, not just the scroll position", async ({ page }) => {
      await open(page, target.url("default"));
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await button(page).click();
      await expect(page.locator("h1")).toBeFocused();
      // It scrolls smoothly, so the position arrives a moment after the focus does.
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(100);
    });

    test("corner variant: named even with the words hidden", async ({ page }) => {
      await open(page, target.url("corner"));
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await expect(button(page)).toBeVisible();
    });
  });
}

test("registry serves back to top with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/back-to-top.json?position=left&showAfter=99999")).json();
  expect(item).toMatchObject({ name: "back-to-top", type: "registry:component" });
  expect(item.files[0].content).toContain('"position": "left"');
  expect(item.files[0].content).toContain('"showAfter": 4000'); // clamped to the schema maximum
});
