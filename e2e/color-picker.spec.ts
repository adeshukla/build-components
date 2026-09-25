import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["color-picker"].variants);
const swatch = (page: Page, name: string) => page.getByRole("radio", { name, exact: true });

for (const target of targets("color-picker")) {
  test.describe(`colour picker — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("swatches are named, in one group, with one chosen", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("group", { name: "Label colour" })).toBeVisible();
      await expect(swatch(page, "Ocean")).toBeChecked();
      await expect(page.getByText("#2563eb", { exact: true })).toBeVisible();
      await expect(page.locator('input[type="hidden"][name="colour"]')).toHaveValue("#2563eb");
    });

    test("arrow keys pick, and the choice is announced by name", async ({ page }) => {
      await open(page, target.url("default"));
      await swatch(page, "Ocean").focus();
      await page.keyboard.press("ArrowRight");
      await expect(swatch(page, "Moss")).toBeChecked();
      await expect(page.getByRole("status")).toHaveText("Moss chosen, #15803d.");
      await expect(page.locator('input[type="hidden"][name="colour"]')).toHaveValue("#15803d");
    });

    test("the browser's own picker is offered and labelled", async ({ page }) => {
      await open(page, target.url("default"));
      const custom = page.getByLabel("Any other colour");
      await expect(custom).toHaveAttribute("type", "color");
      await expect(custom).toHaveValue("#2563eb");
    });

    test("plain variant: no custom picker, no hex shown", async ({ page }) => {
      await open(page, target.url("plain"));
      await expect(page.getByLabel("Any other colour")).toHaveCount(0);
      await expect(page.getByText("#15803d", { exact: true })).toHaveCount(0);
      await expect(swatch(page, "Moss")).toBeChecked();
    });
  });
}

test("registry serves the colour picker with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/color-picker.json?allowCustom=false&startHex=%23ff0000")).json();
  expect(item).toMatchObject({ name: "color-picker", type: "registry:component" });
  expect(item.files[0].content).toContain('"allowCustom": false');
  expect(item.files[0].content).toContain('"startHex": "#ff0000"');
});
