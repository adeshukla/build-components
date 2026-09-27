import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["address-fields"].variants);
const country = (page: Page) => page.getByRole("combobox", { name: "Country" });

for (const target of targets("address-fields")) {
  test.describe(`address fields — ${target.name} export`, () => {
    test("no axe violations for every variant, and for each country", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      for (const code of ["US", "DE"]) {
        await country(page).selectOption(code);
        await expectNoAxeViolations(page);
      }
    });

    test("every field carries the autocomplete token for its own purpose", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(country(page)).toHaveAttribute("autocomplete", "country");
      await expect(page.getByRole("textbox", { name: "Address line 1" })).toHaveAttribute("autocomplete", "address-line1");
      await expect(page.getByRole("textbox", { name: /Address line 2/ })).toHaveAttribute("autocomplete", "address-line2");
      await expect(page.getByRole("textbox", { name: "Town or city" })).toHaveAttribute("autocomplete", "address-level2");
      await expect(page.getByRole("textbox", { name: "Postcode" })).toHaveAttribute("autocomplete", "postal-code");
    });

    test("the postcode field is called what that country calls it", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("textbox", { name: "Postcode" })).toBeVisible();
      await country(page).selectOption("US");
      await expect(page.getByRole("textbox", { name: "ZIP code" })).toBeVisible();
      await country(page).selectOption("IE");
      await expect(page.getByRole("textbox", { name: "Eircode" })).toBeVisible();
    });

    test("a region field appears only for countries that have one", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("textbox", { name: "County" })).toBeVisible();
      await country(page).selectOption("US");
      await expect(page.getByRole("textbox", { name: "State" })).toBeVisible();
      await country(page).selectOption("DE");
      await expect(page.getByRole("textbox", { name: "State" })).toHaveCount(0);
      await expect(page.getByRole("textbox", { name: "County" })).toHaveCount(0);
    });

    test("changing the country is said out loud", async ({ page }) => {
      await open(page, target.url("default"));
      await country(page).selectOption("US");
      await expect(page.getByRole("status")).toHaveText(/United States.*ZIP code/);
    });

    test("the fields send one field name each", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("textbox", { name: "Address line 1" })).toHaveAttribute("name", "addressLine1");
      await expect(page.getByRole("textbox", { name: "Postcode" })).toHaveAttribute("name", "addressPostcode");
    });

    test("compact variant: no second line, country last", async ({ page }) => {
      await open(page, target.url("compact"));
      await expect(page.getByRole("textbox", { name: /Address line 2/ })).toHaveCount(0);
      const fields = page.locator("input, select");
      await expect(fields.last()).toHaveAttribute("autocomplete", "country");
    });
  });
}

test("registry serves the address fields with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/address-fields.json?name=billing&showLine2=false")).json();
  expect(item).toMatchObject({ name: "address-fields", type: "registry:component" });
  expect(item.files[0].content).toContain('"name": "billing"');
  expect(item.files[0].content).toContain('"showLine2": false');
});
