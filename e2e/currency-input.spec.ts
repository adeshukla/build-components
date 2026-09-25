import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["currency-input"].variants);
const field = (page: Page) => page.getByRole("textbox", { name: /Amount/ });
const hidden = (page: Page) => page.locator('input[type="hidden"][name="amount"]');

for (const target of targets("currency-input")) {
  test.describe(`currency input — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("the currency is part of the field's name, and the amount starts tidy", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(field(page)).toHaveAccessibleName("Amount in £");
      await expect(field(page)).toHaveValue("1,250.00");
      await expect(hidden(page)).toHaveValue("1250.00");
    });

    test("typing is left alone until you leave the field", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page).fill("4999.5");
      await expect(field(page)).toHaveValue("4999.5");
      await field(page).blur();
      await expect(field(page)).toHaveValue("4,999.50");
      await expect(hidden(page)).toHaveValue("4999.50");
    });

    test("an amount that can't be read is explained", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page).fill("abc");
      await field(page).blur();
      await expect(page.getByText("Enter an amount, for example 12.50.")).toBeVisible();
      await expect(field(page)).toHaveAttribute("aria-invalid", "true");
      await expect(hidden(page)).toHaveValue("");
    });

    test("dollars variant: no decimals, negatives allowed", async ({ page }) => {
      await open(page, target.url("dollars"));
      const dollars = page.getByRole("textbox", { name: /Amount/ });
      await expect(dollars).toHaveValue("-45");
      await dollars.fill("-1234.7");
      await dollars.blur();
      await expect(dollars).toHaveValue("-1,235");
    });
  });
}

test("registry serves the currency input with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/currency-input.json?symbol=%24&decimals=9")).json();
  expect(item).toMatchObject({ name: "currency-input", type: "registry:component" });
  expect(item.files[0].content).toContain('"symbol": "$"');
  expect(item.files[0].content).toContain('"decimals": 4'); // clamped to the schema maximum
});
