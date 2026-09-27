import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["faq"].variants);
// The summary holds the question and the plus sign, so it is found by the text it contains.
const question = (page: Page, name: string) => page.locator("summary").filter({ hasText: name });
const answer = (page: Page, text: RegExp) => page.getByText(text);
const toggleAll = (page: Page) => page.getByRole("button", { name: /Open all|Close all/ });

for (const target of targets("faq")) {
  test.describe(`faq — ${target.name} export`, () => {
    test("no axe violations for every variant, closed and open", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await question(page, "Do I need to install anything?").click();
      await expectNoAxeViolations(page);
    });

    test("answers start closed and open on click", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(answer(page, /You copy the files into your project/)).toBeHidden();
      await question(page, "Do I need to install anything?").click();
      await expect(answer(page, /You copy the files into your project/)).toBeVisible();
    });

    test("Enter opens the answer you are on", async ({ page }) => {
      await open(page, target.url("default"));
      await page.locator("summary").first().focus();
      await page.keyboard.press("Enter");
      await expect(answer(page, /You copy the files into your project/)).toBeVisible();
    });

    test("open all opens every answer and reports itself", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(toggleAll(page)).toHaveAttribute("aria-pressed", "false");
      await toggleAll(page).click();
      await expect(toggleAll(page)).toHaveAttribute("aria-pressed", "true");
      await expect(toggleAll(page)).toHaveText("Close all");
      expect(await page.locator("details[open]").count()).toBe(4);
      await toggleAll(page).click();
      expect(await page.locator("details[open]").count()).toBe(0);
    });

    test("open variant: the first answer is already out, and there is no open-all button", async ({ page }) => {
      await open(page, target.url("open"));
      await expect(answer(page, /You copy the files into your project/)).toBeVisible();
      await expect(toggleAll(page)).toHaveCount(0);
    });
  });
}

test("registry serves the faq with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/faq.json?heading=Help&openFirst=true")).json();
  expect(item).toMatchObject({ name: "faq", type: "registry:component" });
  expect(item.files[0].content).toContain('"heading": "Help"');
  expect(item.files[0].content).toContain('"openFirst": true');
});
