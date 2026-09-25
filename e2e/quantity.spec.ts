import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.quantity.variants);
const field = (page: Page, name = "Quantity") => page.getByRole("spinbutton", { name });

for (const target of targets("quantity")) {
  test.describe(`quantity stepper — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("the buttons are named, and each press is announced", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(field(page)).toHaveValue("1");
      await page.getByRole("button", { name: "More quantity" }).click();
      await expect(field(page)).toHaveValue("2");
      await expect(page.getByRole("status")).toHaveText("2");
    });

    test("a limit is said in words instead of doing nothing", async ({ page }) => {
      await open(page, target.url("default"));
      const less = page.getByRole("button", { name: "Fewer quantity" });
      await expect(less).toHaveAttribute("aria-disabled", "true");
      await less.click({ force: true });
      await expect(page.getByRole("status")).toHaveText("1. That is the fewest you can have.");
      await expect(field(page)).toHaveValue("1");
    });

    test("a number typed out of range is corrected and explained", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page).fill("99");
      await field(page).blur();
      await expect(field(page)).toHaveValue("10");
      await expect(page.getByRole("status")).toHaveText("10. Between 1 and 10 is allowed.");
    });

    test("units variant: the unit is part of what is announced", async ({ page }) => {
      await open(page, target.url("units"));
      await page.getByRole("button", { name: "More weight" }).click();
      await expect(page.getByRole("status")).toHaveText("3 kg");
    });
  });
}

test("registry serves the quantity stepper with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/quantity.json?unit=kg&max=9999")).json();
  expect(item).toMatchObject({ name: "quantity", type: "registry:component" });
  expect(item.files[0].content).toContain('"unit": "kg"');
  expect(item.files[0].content).toContain('"max": 999'); // clamped to the schema maximum
});
