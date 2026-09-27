import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["help-hint"].variants);
const toggle = (page: Page) => page.getByRole("button", { name: /Help with this answer|More about this/ });
const help = (page: Page) => page.locator("[data-help], #hlp-help").first();
const field = (page: Page) => page.getByRole("textbox");

for (const target of targets("help-hint")) {
  test.describe(`help hint — ${target.name} export`, () => {
    test("no axe violations for every variant, closed and open", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await toggle(page).click();
      await expectNoAxeViolations(page);
    });

    test("it is a disclosure, closed to begin with", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(toggle(page)).toHaveAttribute("aria-expanded", "false");
      await expect(page.getByText("Two letters, six digits")).toBeHidden();
    });

    test("opening it shows the help and says so on the button", async ({ page }) => {
      await open(page, target.url("default"));
      await toggle(page).click();
      await expect(toggle(page)).toHaveAttribute("aria-expanded", "true");
      await expect(page.getByText("Two letters, six digits")).toBeVisible();
      // It stays until it is closed again: no hover, no timer.
      await field(page).hover();
      await expect(page.getByText("Two letters, six digits")).toBeVisible();
      await toggle(page).click();
      await expect(page.getByText("Two letters, six digits")).toBeHidden();
    });

    test("the help joins the field's description only while it is open", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(field(page)).toHaveAccessibleDescription(/payslip, P60/);
      await expect(field(page)).not.toHaveAccessibleDescription(/Two letters, six digits/);
      await toggle(page).click();
      await expect(field(page)).toHaveAccessibleDescription(/Two letters, six digits/);
      await toggle(page).click();
      await expect(field(page)).not.toHaveAccessibleDescription(/Two letters, six digits/);
    });

    test("the short hint and the example are always there", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByText("It is on your payslip")).toBeVisible();
      await expect(field(page)).toHaveAccessibleDescription(/QQ 12 34 56 C/);
    });

    test("the button is named in words, and the glyph is decoration", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(toggle(page)).toHaveAccessibleName("Help with this answer");
      const box = await toggle(page).boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    });

    test("there is no placeholder competing with the example", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(field(page)).not.toHaveAttribute("placeholder", /.+/);
    });

    test("open variant: the help is there from the start and already described", async ({ page }) => {
      await open(page, target.url("open"));
      await expect(toggle(page)).toHaveAttribute("aria-expanded", "true");
      await expect(help(page)).toBeVisible();
      await expect(field(page)).toHaveAccessibleDescription(/Two letters, six digits/);
    });
  });
}

test("registry serves the help hint with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/help-hint.json?startOpen=true&name=insurance")).json();
  expect(item).toMatchObject({ name: "help-hint", type: "registry:component" });
  expect(item.files[0].content).toContain('"startOpen": true');
  expect(item.files[0].content).toContain('"name": "insurance"');
});
