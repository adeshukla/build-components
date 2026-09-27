import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["checkbox-group"].variants);
const box = (page: Page, name: string | RegExp) => page.getByRole("checkbox", { name });
const all = (page: Page) => page.getByRole("checkbox", { name: "Everything" });

for (const target of targets("checkbox-group")) {
  test.describe(`checkbox group — ${target.name} export`, () => {
    test("no axe violations for every variant, empty, part-picked and in error", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await box(page, /Product updates/).check();
      await expectNoAxeViolations(page);
      await box(page, /Product updates/).uncheck();
      await page.getByRole("button", { name: "Save choices" }).click();
      await expectNoAxeViolations(page);
    });

    test("it is one question with one fieldset", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("group", { name: /What should we email you about/ })).toBeVisible();
      await expect(page.getByRole("checkbox")).toHaveCount(5); // four topics plus everything
    });

    test("the everything box goes mixed when only some are ticked", async ({ page }) => {
      await open(page, target.url("default"));
      await box(page, /Release notes/).check();
      expect(await all(page).evaluate((node: HTMLInputElement) => node.indeterminate)).toBe(true);
      await expect(all(page)).not.toBeChecked();
      await all(page).check();
      await expect(box(page, /Offers/)).toBeChecked();
      expect(await all(page).evaluate((node: HTMLInputElement) => node.indeterminate)).toBe(false);
    });

    test("the count follows the boxes", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("status")).toHaveText("0 of 4 picked");
      await box(page, /Product updates/).check();
      await box(page, /Offers/).check();
      await expect(page.getByRole("status")).toHaveText("2 of 4 picked");
    });

    test("saving nothing explains itself, and the error clears on the first tick", async ({ page }) => {
      await open(page, target.url("default"));
      await page.getByRole("button", { name: "Save choices" }).click();
      const alert = page.getByRole("alert").filter({ hasText: "at least one" });
      await expect(alert).toBeVisible();
      await box(page, /Release notes/).check();
      await expect(alert).toHaveCount(0);
    });

    test("compact variant: no everything box, no count, nothing needed", async ({ page }) => {
      await open(page, target.url("compact"));
      await expect(page.getByRole("checkbox")).toHaveCount(4);
      await page.getByRole("button", { name: "Save choices" }).click();
      await expect(page.getByRole("alert").filter({ hasText: "at least one" })).toHaveCount(0);
    });
  });
}

test("registry serves the checkbox group with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/checkbox-group.json?name=topics2&minRequired=2")).json();
  expect(item).toMatchObject({ name: "checkbox-group", type: "registry:component" });
  expect(item.files[0].content).toContain('"name": "topics2"');
  expect(item.files[0].content).toContain('"minRequired": 2');
});
