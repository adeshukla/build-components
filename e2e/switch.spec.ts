import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.switch.variants);
const control = (page: Page) => page.getByRole("switch", { name: "Email notifications" });

for (const target of targets("switch")) {
  test.describe(`switch — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("it is a switch, not a tick box, and carries its hint", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(control(page)).toBeChecked();
      await expect(control(page)).toHaveAccessibleDescription("We'll email you when someone replies.");
      await expect(page.getByText("On", { exact: true })).toBeVisible();
    });

    test("Space flips it, and the word follows", async ({ page }) => {
      await open(page, target.url("default"));
      await control(page).focus();
      await page.keyboard.press("Space");
      await expect(control(page)).not.toBeChecked();
      await expect(page.getByText("Off", { exact: true })).toBeVisible();
      await page.keyboard.press("Space");
      await expect(control(page)).toBeChecked();
    });

    test("clicking the label works too", async ({ page }) => {
      await open(page, target.url("default"));
      await page.getByText("Email notifications").click();
      await expect(control(page)).not.toBeChecked();
    });

    test("small variant: starts on, no word, switch first", async ({ page }) => {
      await open(page, target.url("small"));
      await expect(page.getByText("On", { exact: true })).toHaveCount(0);
      await expect(control(page)).toBeChecked();
    });
  });
}

test("registry serves the switch with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/switch.json?startOn=false&size=huge")).json();
  expect(item).toMatchObject({ name: "switch", type: "registry:component" });
  expect(item.files[0].content).toContain('"startOn": false');
  expect(item.files[0].content).toContain('"size": "md"'); // unknown value falls back
});
