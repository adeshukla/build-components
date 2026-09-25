import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["phone-input"].variants);
const number = (page: Page) => page.getByRole("textbox", { name: "Phone number" });
const hidden = (page: Page) => page.locator('input[type="hidden"][name="phone"]');

for (const target of targets("phone-input")) {
  test.describe(`phone input — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("the country list is named and carries dial codes", async ({ page }) => {
      await open(page, target.url("default"));
      const country = page.getByRole("combobox", { name: "Country code" });
      await expect(country).toBeVisible();
      await expect(country.locator("option").first()).toHaveText("United Kingdom (+44)");
      await expect(number(page)).toHaveAttribute("autocomplete", "tel-national");
    });

    test("digits are grouped the local way and submitted as one number", async ({ page }) => {
      await open(page, target.url("default"));
      await number(page).fill("7700900123");
      await expect(number(page)).toHaveValue("7700 900123");
      await expect(hidden(page)).toHaveValue("+447700900123");

      await page.getByRole("combobox", { name: "Country code" }).selectOption("United States");
      await expect(number(page)).toHaveValue("770 090 0123");
      await expect(hidden(page)).toHaveValue("+17700900123");
    });

    test("a too-short number is explained on leaving the field", async ({ page }) => {
      await open(page, target.url("default"));
      await number(page).fill("123");
      await number(page).blur();
      await expect(page.getByText("That number looks too short. Check it and try again.")).toBeVisible();
      await expect(number(page)).toHaveAttribute("aria-invalid", "true");
    });
  });
}

test("registry serves the phone input with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/phone-input.json?startCountry=Ireland")).json();
  expect(item).toMatchObject({ name: "phone-input", type: "registry:component" });
  expect(item.files[0].content).toContain('"startCountry": "Ireland"');
});
