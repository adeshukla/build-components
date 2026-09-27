import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["inline-confirm"].variants);
const start = (page: Page) => page.getByRole("button", { name: /^(Delete|Remove)$/ });
const group = (page: Page) => page.getByRole("group");
const confirm = (page: Page) => page.getByRole("button", { name: /^Yes, / });
const cancel = (page: Page) => page.getByRole("button", { name: /Keep it|Leave it/ });

for (const target of targets("inline-confirm")) {
  test.describe(`inline confirm — ${target.name} export`, () => {
    test("no axe violations for every variant, asking and afterwards", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await start(page).click();
      await expectNoAxeViolations(page);
      await confirm(page).click();
      await expectNoAxeViolations(page);
    });

    test("nothing is asked before the action is pressed", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(group(page)).toBeHidden();
      await expect(start(page)).toBeVisible();
    });

    test("it asks in place, with no dialog over the page", async ({ page }) => {
      await open(page, target.url("default"));
      await start(page).click();
      await expect(group(page)).toBeVisible();
      await expect(group(page)).toHaveAccessibleName("Delete this file?");
      await expect(page.locator("dialog")).toHaveCount(0);
      await expect(start(page)).toBeHidden();
    });

    test("focus lands on the safe answer, not the destructive one", async ({ page }) => {
      await open(page, target.url("default"));
      await start(page).click();
      await expect(cancel(page)).toBeFocused();
    });

    test("Escape backs out and gives focus back to the button that asked", async ({ page }) => {
      await open(page, target.url("default"));
      await start(page).click();
      await page.keyboard.press("Escape");
      await expect(group(page)).toBeHidden();
      await expect(start(page)).toBeFocused();
      await expect(page.getByRole("status")).toHaveText("Nothing was deleted.");
    });

    test("cancelling says so and puts the button back", async ({ page }) => {
      await open(page, target.url("default"));
      await start(page).click();
      await cancel(page).click();
      await expect(start(page)).toBeVisible();
      await expect(page.getByRole("status")).toHaveText("Nothing was deleted.");
    });

    test("confirming says so and leaves focus on the row, not the page", async ({ page }) => {
      await open(page, target.url("default"));
      await start(page).click();
      await confirm(page).click();
      await expect(group(page)).toBeHidden();
      await expect(page.getByRole("status")).toHaveText("Quarterly report.pdf deleted.");
      await expect(page.getByRole("listitem")).toBeFocused();
    });

    test("nothing above moves, and the row never shrinks, when the question appears", async ({ page }) => {
      await open(page, target.url("default"));
      const row = page.getByRole("listitem");
      const name = page.locator("[data-name], li > span").first();
      const before = await name.boundingBox();
      const idle = (await row.boundingBox())?.height ?? 0;
      await start(page).click();
      const after = await name.boundingBox();
      // The thing being acted on stays exactly where it was: on a narrow screen the question wraps
      // below it rather than squeezing it, so the row grows downwards and never upwards.
      expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThan(2);
      expect((await row.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(idle);
    });

    test("confirm-first variant: focus lands on the confirm answer instead", async ({ page }) => {
      await open(page, target.url("confirm-first"));
      await start(page).click();
      await expect(confirm(page)).toBeFocused();
    });
  });
}

test("registry serves the inline confirm with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/inline-confirm.json?focusOn=confirm&actionLabel=Remove")).json();
  expect(item).toMatchObject({ name: "inline-confirm", type: "registry:component" });
  expect(item.files[0].content).toContain('"focusOn": "confirm"');
  expect(item.files[0].content).toContain('"actionLabel": "Remove"');
});
