import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.password.variants);
const field = (page: Page) => page.getByLabel(/password/i).first();

for (const target of targets("password")) {
  test.describe(`password — ${target.name} export`, () => {
    test("no axe violations, empty and filled, for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await field(page).fill("short");
      await expectNoAxeViolations(page);
    });

    test("the rules are read with the field, before anything is typed", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(field(page)).toHaveAccessibleDescription(/At least 12 characters/);
      await expect(field(page)).toHaveAccessibleDescription(/A number/);
      await expect(field(page)).toHaveAttribute("type", "password");
      await expect(field(page)).toHaveAttribute("autocomplete", "new-password");
    });

    test("each rule says in words whether it is met", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByText("At least 12 characters (not met yet)")).toBeAttached();

      await field(page).fill("correcthorsebattery7");
      await expect(page.getByText("At least 12 characters (met)")).toBeAttached();
      await expect(page.getByText("A number (met)")).toBeAttached();
    });

    test("the strength is a word, not only a bar", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByText("Password strength: Enter a password")).toBeVisible();

      await field(page).fill("abc");
      await expect(page.getByText(/Password strength: (Weak|Fair)/)).toBeVisible();

      await field(page).fill("correcthorsebattery7!");
      await expect(page.getByText(/Password strength: (Good|Strong)/)).toBeVisible();
    });

    test("the show button says what it does and whether it is pressed", async ({ page }) => {
      await open(page, target.url("default"));
      const toggle = page.getByRole("button", { name: /password/i });
      await expect(toggle).toHaveAttribute("aria-pressed", "false");

      await toggle.click();
      await expect(field(page)).toHaveAttribute("type", "text");
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
      await expect(toggle).toHaveAccessibleName(/Hide password/);
    });

    test("strict variant: more rules, and no meter", async ({ page }) => {
      await open(page, target.url("strict"));
      await expect(page.getByText(/A capital letter/)).toBeAttached();
      await expect(page.getByText(/A symbol/)).toBeAttached();
      await expect(page.getByText(/Password strength/)).toHaveCount(0);
      await expect(field(page)).toHaveAccessibleDescription(/At least 16 characters/);
    });
  });
}

test("registry serves the password with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/password.json?minLength=999&requireSymbol=true&showMeter=false")).json();
  expect(item).toMatchObject({ name: "password", type: "registry:component" });
  expect(item.files[0].content).toContain('"requireSymbol": true');
  expect(item.files[0].content).toContain('"showMeter": false');
  expect(item.files[0].content).toContain('"minLength": 64'); // clamped to the schema maximum
});
