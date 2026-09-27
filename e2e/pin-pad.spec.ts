import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["pin-pad"].variants);
const key = (page: Page, digit: string) => page.getByRole("button", { name: digit, exact: true });
const status = (page: Page) => page.getByRole("status");

for (const target of targets("pin-pad")) {
  test.describe(`PIN pad — ${target.name} export`, () => {
    test("no axe violations for every variant, empty and full", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      for (const digit of ["1", "2", "3", "4"]) await key(page, digit).click();
      await expectNoAxeViolations(page);
    });

    test("the pad is buttons in a named group, and the value is one hidden field", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("group", { name: /Enter your PIN/ })).toBeVisible();
      await expect(page.locator("input[name=pin]")).toHaveAttribute("type", "hidden");
      await expect(page.locator("input[type=text], input[type=password]")).toHaveCount(0);
    });

    test("the count is announced, and the digits are not", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(status(page)).toHaveText("0 of 4 digits entered");
      await key(page, "7").click();
      await expect(status(page)).toHaveText("1 of 4 digits entered");
      await key(page, "0").click();
      await expect(status(page)).toHaveText("2 of 4 digits entered");
      await expect(status(page)).not.toContainText("7");
    });

    test("typing the digits works as well as tapping, and Backspace removes one", async ({ page }) => {
      await open(page, target.url("default"));
      await key(page, "1").focus();
      await page.keyboard.type("246");
      await expect(page.locator("input[name=pin]")).toHaveValue("246");
      await page.keyboard.press("Backspace");
      await expect(page.locator("input[name=pin]")).toHaveValue("24");
      await expect(status(page)).toHaveText("2 of 4 digits entered");
    });

    test("it stops at its length and says so, and Clear empties it", async ({ page }) => {
      await open(page, target.url("default"));
      await key(page, "1").focus();
      await page.keyboard.type("123456");
      await expect(page.locator("input[name=pin]")).toHaveValue("1234");
      await expect(status(page)).toHaveText("PIN complete.");
      await page.getByRole("button", { name: "Clear" }).click();
      await expect(page.locator("input[name=pin]")).toHaveValue("");
    });

    test("the delete key is named in words, not by its glyph", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("button", { name: "Delete last digit" })).toBeVisible();
    });

    test("calculator variant: six digits, 7 at the top, no clear key", async ({ page }) => {
      await open(page, target.url("calculator"));
      await expect(status(page)).toHaveText("0 of 6 digits entered");
      await expect(page.getByRole("button", { name: "Clear" })).toHaveCount(0);
      const digits = await page.getByRole("button").filter({ hasText: /^[0-9]$/ }).allInnerTexts();
      expect(digits.slice(0, 3)).toEqual(["7", "8", "9"]);
    });
  });
}

test("registry serves the PIN pad with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/pin-pad.json?length=6&layout=calculator")).json();
  expect(item).toMatchObject({ name: "pin-pad", type: "registry:component" });
  expect(item.files[0].content).toContain('"length": 6');
  expect(item.files[0].content).toContain('"layout": "calculator"');
});
