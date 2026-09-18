import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["searchable-select"].variants);

const combo = (page: Page, name: RegExp | string) => page.getByRole("combobox", { name });
const country = (page: Page) => combo(page, "Country");
const status = (page: Page) => page.locator('[aria-live="polite"]').last();

for (const target of targets("searchable-select")) {
  test.describe(`searchable select — ${target.name} export`, () => {
    test("no axe violations, closed and open, for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
        await page.getByRole("button", { name: /^Show / }).click();
        await expect(page.getByRole("listbox")).toBeVisible();
        await expectNoAxeViolations(page);
      }
    });

    test("keyboard only: open, move, choose, and the form value follows", async ({ page }) => {
      await open(page, target.url("default"));
      const field = country(page);
      await field.focus();
      await expect(field).toHaveAttribute("aria-expanded", "false");

      await field.press("ArrowDown");
      await expect(field).toHaveAttribute("aria-expanded", "true");
      await expect(field).toHaveAttribute("aria-activedescendant", /-option-0$/);
      await field.press("ArrowDown");
      await expect(field).toHaveAttribute("aria-activedescendant", /-option-1$/);
      await field.press("ArrowUp");
      await expect(field).toHaveAttribute("aria-activedescendant", /-option-0$/);

      await field.press("Enter");
      await expect(field).toHaveValue("Australia");
      await expect(page.getByRole("listbox")).toBeHidden();
      await expect(page.locator('input[name="country"]')).toHaveValue("Australia");
    });

    test("typing filters the list and announces how many results are left", async ({ page }) => {
      await open(page, target.url("default"));
      const field = country(page);
      await field.click();
      await field.fill("uni");
      await expect(page.getByRole("option")).toHaveCount(2);
      await expect(status(page)).toHaveText("2 results available.");

      await field.fill("united kingdom");
      await expect(page.getByRole("option")).toHaveCount(1);
      await expect(status(page)).toHaveText("1 result available.");

      await field.fill("zzz");
      await expect(page.getByRole("listbox")).toBeHidden();
      // The message is on screen, and the live region announces the same words.
      await expect(page.locator("[data-no-results]")).toBeVisible();
      await expect(page.locator("[data-no-results]")).toHaveText("No matches. Try a different spelling.");
      await expect(status(page)).toHaveText("No matches. Try a different spelling.");
    });

    test("text that is not an option gets an error on the way out", async ({ page }) => {
      await open(page, target.url("default"));
      const field = country(page);
      await field.fill("Atlantis");
      await field.press("Tab");
      await expect(field).toHaveAttribute("aria-invalid", "true");
      await expect(field).toHaveAccessibleDescription("Choose a country from the list.");
      await expect(page.locator('input[name="country"]')).toHaveValue("");

      await field.fill("france");
      await field.press("Tab");
      await expect(field).toHaveValue("France"); // corrected to the option's own spelling
      await expect(field).not.toHaveAttribute("aria-invalid");
      await expect(page.locator('input[name="country"]')).toHaveValue("France");
    });

    test("Escape closes the list, then clears the field", async ({ page }) => {
      await open(page, target.url("default"));
      const field = country(page);
      await field.fill("uni");
      await expect(page.getByRole("listbox")).toBeVisible();

      await field.press("Escape");
      await expect(page.getByRole("listbox")).toBeHidden();
      await expect(field).toHaveValue("uni");

      await field.press("Escape");
      await expect(field).toHaveValue("");
    });

    test("compact variant: matches from the start, and the clear button empties it", async ({ page }) => {
      await open(page, target.url("compact"));
      const field = combo(page, "Fruit");
      await field.fill("b");
      // "Banana" and "Blackberry" start with b; "Apricot" contains one but does not start with it.
      await expect(page.getByRole("option")).toHaveCount(2);

      await field.press("ArrowDown");
      await field.press("Enter");
      await expect(field).toHaveValue("Banana");
      await expect(page.locator('input[name="fruit"]')).toHaveValue("Banana");

      await page.getByRole("button", { name: "Clear fruit" }).click();
      await expect(field).toHaveValue("");
      await expect(field).toBeFocused();
      await expect(page.locator('input[name="fruit"]')).toHaveValue("");
    });
  });
}

test("registry serves the searchable select with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/searchable-select.json?filter=startsWith&maxVisible=99")).json();
  expect(item).toMatchObject({ name: "searchable-select", type: "registry:component" });
  expect(item.files[0].content).toContain('"filter": "startsWith"');
  expect(item.files[0].content).toContain('"maxVisible": 10'); // clamped to the schema's maximum
});
