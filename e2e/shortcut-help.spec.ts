import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["shortcut-help"].variants);
const dialog = (page: Page) => page.getByRole("dialog");
const closeButton = (page: Page) => page.getByRole("button", { name: "Close the shortcut list" });

for (const target of targets("shortcut-help") ) {
  test.describe(`shortcut help — ${target.name} export`, () => {
    test("no axe violations for every variant, closed and open", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
        await page.keyboard.press(variant === "slash" ? "/" : "?");
        await expect(dialog(page)).toBeVisible();
        await expectNoAxeViolations(page);
      }
    });

    test("the key opens it from the page and Escape gives focus back", async ({ page }) => {
      await open(page, target.url("default"));
      const trigger = page.getByRole("button", { name: /Keyboard shortcuts/ });
      await trigger.focus();
      await page.keyboard.press("?");
      await expect(dialog(page)).toBeVisible();
      await expect(closeButton(page)).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(dialog(page)).toBeHidden();
      await expect(trigger).toBeFocused();
    });

    test("the shortcuts are a description list of real keys", async ({ page }) => {
      await open(page, target.url("default"));
      await page.keyboard.press("?");
      await expect(dialog(page).locator("dt kbd").first()).toHaveText("?");
      await expect(dialog(page).getByText("Go home")).toBeVisible();
      // "g then h" is two keys with the word between them, not one long string.
      await expect(dialog(page).locator("dt").filter({ hasText: "then" }).first().locator("kbd")).toHaveCount(2);
    });

    test("the key is ignored while someone is typing", async ({ page }) => {
      await open(page, target.url("default"));
      // A field of the host page, which is where this shortcut usually gets in the way.
      await page.evaluate(() => {
        const input = document.createElement("input");
        input.id = "outside-field";
        document.body.append(input);
        input.focus();
      });
      await page.keyboard.press("?");
      await expect(dialog(page)).toBeHidden();
      await expect(page.locator("#outside-field")).toHaveValue("?");
    });

    test("it ignores the key with a modifier held, so browser shortcuts still work", async ({ page }) => {
      await open(page, target.url("default"));
      await page.keyboard.press("Control+?");
      await expect(dialog(page)).toBeHidden();
    });

    test("slash variant: no visible button, / opens it", async ({ page }) => {
      await open(page, target.url("slash"));
      await expect(page.getByRole("button", { name: /Keyboard shortcuts/ })).toHaveCount(0);
      await page.keyboard.press("/");
      await expect(dialog(page)).toBeVisible();
      await expect(dialog(page).getByText("Press / to bring this back.")).toBeVisible();
    });
  });
}

test("registry serves the shortcut help with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/shortcut-help.json?openKey=F1&showTrigger=false")).json();
  expect(item).toMatchObject({ name: "shortcut-help", type: "registry:component" });
  expect(item.files[0].content).toContain('"openKey": "F1"');
  expect(item.files[0].content).toContain('"showTrigger": false');
});
