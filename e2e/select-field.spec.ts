import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["select-field"].variants);
const field = (page: Page) => page.getByRole("combobox", { name: /Which yard/ });

for (const target of targets("select-field")) {
  test.describe(`select field — ${target.name} export`, () => {
    test("no axe violations for every variant, and in error", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await page.getByRole("button", { name: "Carry on" }).click();
      await expectNoAxeViolations(page);
    });

    test("it starts genuinely unanswered, with a prompt", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(field(page)).toHaveValue("");
      await expect(field(page).locator("option").first()).toHaveText("Choose a yard");
      await expect(field(page)).toHaveAccessibleName(/needed/);
    });

    test("the options are grouped", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(field(page).locator("optgroup")).toHaveCount(3);
      await expect(field(page).locator('optgroup[label="South west"] option')).toHaveCount(2);
    });

    test("carrying on with nothing chosen is an error that takes focus back", async ({ page }) => {
      await open(page, target.url("default"));
      await page.getByRole("button", { name: "Carry on" }).click();
      await expect(page.getByRole("alert").filter({ hasText: "Choose a yard" })).toBeVisible();
      await expect(field(page)).toHaveAttribute("aria-invalid", "true");
      await expect(field(page)).toBeFocused();
      await expect(field(page)).toHaveAccessibleDescription(/Choose a yard before carrying on/);
    });

    test("choosing clears the error and says what was chosen", async ({ page }) => {
      await open(page, target.url("default"));
      await page.getByRole("button", { name: "Carry on" }).click();
      await field(page).selectOption("Plymouth");
      await expect(page.getByRole("alert").filter({ hasText: "Choose a yard" })).toHaveCount(0);
      await expect(field(page)).not.toHaveAttribute("aria-invalid", "true");
      await expect(page.getByRole("status")).toHaveText("Plymouth chosen");
    });

    test("flat variant: not needed, so carrying on is quiet", async ({ page }) => {
      await open(page, target.url("flat"));
      await expect(field(page)).not.toHaveAccessibleName(/needed/);
      await page.getByRole("button", { name: "Carry on" }).click();
      await expect(page.getByRole("alert").filter({ hasText: "Choose a yard" })).toHaveCount(0);
    });
  });
}

test("registry serves the select field with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/select-field.json?name=depot&required=false")).json();
  expect(item).toMatchObject({ name: "select-field", type: "registry:component" });
  expect(item.files[0].content).toContain('"name": "depot"');
  expect(item.files[0].content).toContain('"required": false');
});
