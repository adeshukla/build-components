import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["undo-snackbar"].variants);
const trigger = (page: Page) => page.getByRole("button", { name: /Archive this message|Delete the draft/ });
const bar = (page: Page) => page.locator("[data-snackbar]");
const said = (page: Page) => page.locator("[data-said], [role=status]").first();
const undo = (page: Page) => page.getByRole("button", { name: "Undo" });

for (const target of targets("undo-snackbar")) {
  test.describe(`undo snackbar — ${target.name} export`, () => {
    test("no axe violations for every variant, before and while shown", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("forever"));
      await trigger(page).click();
      await expect(bar(page)).toBeVisible();
      await expectNoAxeViolations(page);
    });

    test("nothing is shown before the action", async ({ page }) => {
      await open(page, target.url("forever"));
      await expect(bar(page)).toBeHidden();
      await expect(said(page)).toHaveText("");
    });

    test("the words are in a live region of their own, not in the snackbar", async ({ page }) => {
      await open(page, target.url("forever"));
      await trigger(page).click();
      await expect(said(page)).toHaveAttribute("role", "status");
      await expect(said(page)).toHaveText("Message archived.");
      // The snackbar itself is not a live region, and its copy of the words is hidden from readers.
      await expect(bar(page)).not.toHaveAttribute("role", "status");
      await expect(bar(page).locator('p[aria-hidden="true"]')).toBeVisible();
    });

    test("focus is not stolen, and Undo is one Tab away", async ({ page }) => {
      await open(page, target.url("forever"));
      await trigger(page).click();
      // Not "the trigger is still focused": Safari does not focus a clicked button in the first place.
      // The claim is that nothing inside the snackbar took the focus.
      await expect(bar(page).locator(":focus")).toHaveCount(0);
      await undo(page).focus();
      await expect(undo(page)).toBeFocused();
    });

    test("undoing says so and puts the snackbar away", async ({ page }) => {
      await open(page, target.url("forever"));
      await trigger(page).click();
      await undo(page).click();
      await expect(bar(page)).toBeHidden();
      await expect(said(page)).toHaveText("Message put back.");
    });

    test("dismissing keeps the change and says that too", async ({ page }) => {
      await open(page, target.url("forever"));
      await trigger(page).click();
      await page.getByRole("button", { name: "Dismiss" }).click();
      await expect(bar(page)).toBeHidden();
      await expect(said(page)).toHaveText("Message stayed archived.");
    });

    test("it expires on its own, and says that it did", async ({ page }) => {
      await open(page, target.url("quick"));
      await trigger(page).click();
      await expect(bar(page)).toBeVisible();
      await expect(bar(page)).toBeHidden({ timeout: 8_000 });
      await expect(said(page)).toHaveText("Message stayed archived.");
    });

    test("the clock stops while the snackbar is being used", async ({ page }) => {
      await open(page, target.url("quick"));
      await trigger(page).click();
      await undo(page).focus();
      await expect(page.locator("[data-countdown]")).toHaveText("held");
      // Held for longer than its own life, and still there.
      await page.waitForTimeout(4_000);
      await expect(bar(page)).toBeVisible();
    });

    test("nought seconds never expires at all", async ({ page }) => {
      await open(page, target.url("forever"));
      await trigger(page).click();
      await expect(page.locator("[data-countdown]")).toHaveCount(0);
      await page.waitForTimeout(3_000);
      await expect(bar(page)).toBeVisible();
    });
  });
}

test("registry serves the undo snackbar with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/undo-snackbar.json?seconds=0&undoLabel=Put+it+back")).json();
  expect(item).toMatchObject({ name: "undo-snackbar", type: "registry:component" });
  expect(item.files[0].content).toContain('"seconds": 0');
  expect(item.files[0].content).toContain('"undoLabel": "Put it back"');
});
