import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.otp.variants);
const box = (page: Page, position: number) => page.getByLabel(`Character ${position} of 6`);

for (const target of targets("otp")) {
  test.describe(`one-time code — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("the group is labelled, and every box says which one it is", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("group", { name: "Enter the code we sent you" })).toBeVisible();
      await expect(box(page, 1)).toBeVisible();
      await expect(box(page, 6)).toBeVisible();
      await expect(box(page, 1)).toHaveAttribute("autocomplete", "one-time-code");
      await expect(box(page, 1)).toHaveAttribute("inputmode", "numeric");
    });

    test("typing moves along the boxes", async ({ page }) => {
      await open(page, target.url("default"));
      await box(page, 1).click();
      await page.keyboard.type("12");
      await expect(box(page, 1)).toHaveValue("1");
      await expect(box(page, 2)).toHaveValue("2");
      await expect(box(page, 3)).toBeFocused();
    });

    test("Backspace on an empty box steps back and clears", async ({ page }) => {
      await open(page, target.url("default"));
      await box(page, 1).click();
      await page.keyboard.type("12");
      // Focus is on the empty third box, so Backspace steps back and clears the second.
      await page.keyboard.press("Backspace");
      await expect(box(page, 2)).toHaveValue("");
      await expect(box(page, 2)).toBeFocused();
    });

    test("the arrows move without changing anything", async ({ page }) => {
      await open(page, target.url("default"));
      await box(page, 1).click();
      await page.keyboard.type("9");
      await box(page, 2).press("ArrowLeft");
      await expect(box(page, 1)).toBeFocused();
      await expect(box(page, 1)).toHaveValue("9");
    });

    test("filling the code is announced", async ({ page }) => {
      await open(page, target.url("default"));
      await box(page, 1).click();
      await page.keyboard.type("123456");
      await expect(page.getByRole("status")).toHaveText("Code complete.");
    });

    test("letters are refused when the code is digits only", async ({ page }) => {
      await open(page, target.url("default"));
      await box(page, 1).click();
      await page.keyboard.type("a1");
      await expect(box(page, 1)).toHaveValue("1");
    });

    test("single variant: one field that takes the whole code", async ({ page }) => {
      await open(page, target.url("single"));
      const field = page.getByLabel("Enter your code");
      await field.fill("ab12cd");
      await expect(field).toHaveValue("AB12CD"); // letters are allowed here
      await expect(page.getByRole("status")).toHaveText("That is the whole code.");
    });
  });
}

test("registry serves the one-time code with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/otp.json?length=99&mode=grid&allowLetters=true")).json();
  expect(item).toMatchObject({ name: "otp", type: "registry:component" });
  expect(item.files[0].content).toContain('"allowLetters": true');
  expect(item.files[0].content).toContain('"length": 10'); // clamped to the schema maximum
  expect(item.files[0].content).toContain('"mode": "boxes"'); // unknown value falls back
});
