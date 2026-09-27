import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["unit-input"].variants);
const amount = (page: Page) => page.getByRole("textbox");
const unit = (page: Page) => page.getByRole("combobox");

for (const target of targets("unit-input")) {
  test.describe(`unit input — ${target.name} export`, () => {
    test("no axe violations for every variant, and while wrong", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await amount(page).fill("900");
      await amount(page).blur();
      await expectNoAxeViolations(page);
    });

    test("the unit is a named field of its own", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(unit(page)).toHaveAccessibleName(/Unit for/);
      await expect(unit(page).locator("option")).toHaveCount(2);
    });

    test("the number and the unit are read back as one answer", async ({ page }) => {
      await open(page, target.url("default"));
      await amount(page).fill("12.5");
      await expect(page.getByRole("status")).toHaveText("12.5 metres");
      await unit(page).selectOption("ft");
      await expect(page.getByRole("status")).toHaveText("12.5 feet");
    });

    test("a value outside the range is refused in words, on leaving the field", async ({ page }) => {
      await open(page, target.url("default"));
      await amount(page).fill("900");
      await expect(page.getByRole("alert").filter({ hasText: "between 1 and 200" })).toHaveCount(0);
      await amount(page).blur();
      await expect(page.getByRole("alert").filter({ hasText: "between 1 and 200" })).toBeVisible();
      await expect(amount(page)).toHaveAttribute("aria-invalid", "true");
      // Then it follows the typing rather than waiting for another blur.
      await amount(page).fill("12");
      await expect(page.getByRole("alert").filter({ hasText: "between 1 and 200" })).toHaveCount(0);
    });

    test("weight variant: its own range and wording", async ({ page }) => {
      await open(page, target.url("weight"));
      await expect(page.getByText("How heavy is it?", { exact: true })).toBeVisible();
      await amount(page).fill("9000");
      await amount(page).blur();
      await expect(page.getByRole("alert").filter({ hasText: "between 0 and 5000" })).toBeVisible();
    });
  });
}

test("registry serves the unit input with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/unit-input.json?name=depth&max=99")).json();
  expect(item).toMatchObject({ name: "unit-input", type: "registry:component" });
  expect(item.files[0].content).toContain('"name": "depth"');
  expect(item.files[0].content).toContain('"max": 99');
});
