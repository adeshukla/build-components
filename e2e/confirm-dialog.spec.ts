import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["confirm-dialog"].variants);
const trigger = (page: Page) => page.getByRole("button", { name: "Delete workspace", exact: true }).first();
const confirm = (page: Page) => page.getByRole("dialog").getByRole("button", { name: /Delete workspace|Sign out everywhere/ });
const field = (page: Page) => page.getByRole("textbox", { name: "Type DELETE to confirm" });

for (const target of targets("confirm-dialog")) {
  test.describe(`typed confirmation — ${target.name} export`, () => {
    test("no axe violations for every variant, closed and open", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
        await page.getByRole("button").first().click();
        await expect(page.getByRole("dialog")).toBeVisible();
        await expectNoAxeViolations(page);
      }
    });

    test("the confirm button stays off until the phrase matches exactly", async ({ page }) => {
      await open(page, target.url("default"));
      await trigger(page).click();
      await expect(confirm(page)).toBeDisabled();
      await field(page).fill("delete");
      await expect(confirm(page)).toBeDisabled();
      await field(page).fill("DELETE");
      await expect(confirm(page)).toBeEnabled();
      await expect(page.getByText("That matches. The button below is now live.")).toBeVisible();
    });

    test("confirming closes it, says so and hands focus back", async ({ page }) => {
      await open(page, target.url("default"));
      await trigger(page).click();
      await field(page).fill("DELETE");
      await confirm(page).click();
      await expect(page.getByRole("dialog")).toBeHidden();
      await expect(page.getByRole("status")).toHaveText("Confirmed");
      await expect(trigger(page)).toBeFocused();
    });

    test("Escape counts as cancel, and the field starts empty next time", async ({ page }) => {
      await open(page, target.url("default"));
      await trigger(page).click();
      await field(page).fill("DEL");
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toBeHidden();
      await expect(page.getByRole("status")).toHaveText("Cancelled");
      await expect(trigger(page)).toBeFocused();
      await trigger(page).click();
      await expect(field(page)).toHaveValue("");
    });

    test("focus starts in the field and Tab cannot leave the dialog", async ({ page }) => {
      await open(page, target.url("default"));
      await trigger(page).click();
      await expect(field(page)).toBeFocused();
      await field(page).fill("DELETE");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await expect(confirm(page)).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(field(page)).toBeFocused();
    });

    test("plain variant: no phrase, the button is live at once", async ({ page }) => {
      await open(page, target.url("plain"));
      await page.getByRole("button", { name: "Delete workspace" }).first().click();
      await expect(page.getByRole("textbox")).toHaveCount(0);
      const button = page.getByRole("dialog").getByRole("button", { name: "Sign out everywhere" });
      await expect(button).toBeEnabled();
      await button.click();
      await expect(page.getByRole("status")).toHaveText("Confirmed");
    });
  });
}

test("registry serves the confirm dialog with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/confirm-dialog.json?phrase=REMOVE&requirePhrase=false")).json();
  expect(item).toMatchObject({ name: "confirm-dialog", type: "registry:component" });
  expect(item.files[0].content).toContain('"phrase": "REMOVE"');
  expect(item.files[0].content).toContain('"requirePhrase": false');
});
