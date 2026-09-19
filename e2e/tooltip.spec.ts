import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.tooltip.variants);
const trigger = (page: Page, name: string | RegExp) => page.getByRole("button", { name });

for (const target of targets("tooltip")) {
  test.describe(`tooltip — ${target.name} export`, () => {
    test("no axe violations, closed and open, for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
        await page.getByRole("button").first().focus();
        await expectNoAxeViolations(page);
      }
    });

    test("focus opens it at once, and it describes the trigger", async ({ page }) => {
      await open(page, target.url("default"));
      const button = trigger(page, "Delivery options");
      await expect(page.getByRole("tooltip")).toBeHidden();

      await button.focus();
      await expect(page.getByRole("tooltip")).toBeVisible();
      await expect(button).toHaveAccessibleDescription("Orders placed before 2pm are sent the same working day.");
    });

    test("Escape closes it and focus stays on the trigger", async ({ page }) => {
      await open(page, target.url("default"));
      const button = trigger(page, "Delivery options");
      await button.focus();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("tooltip")).toBeHidden();
      await expect(button).toBeFocused();
      await expect(button).not.toHaveAccessibleDescription(/Orders placed/);
    });

    test("hovering opens it, and leaving closes it again", async ({ page }) => {
      await open(page, target.url("default"));
      await trigger(page, "Delivery options").hover();
      await expect(page.getByRole("tooltip")).toBeVisible();
      await page.mouse.move(2, 400);
      await expect(page.getByRole("tooltip")).toBeHidden();
    });

    test("icon variant: the icon button still has a name of its own", async ({ page }) => {
      await open(page, target.url("icon"));
      const button = trigger(page, "What is this?");
      await expect(button).toBeVisible();
      await button.focus();
      await expect(button).toHaveAccessibleDescription("We use this to work out delivery.");
    });
  });
}

test("registry serves the tooltip with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/tooltip.json?placement=sideways&delay=99999&trigger=icon")).json();
  expect(item).toMatchObject({ name: "tooltip", type: "registry:component" });
  expect(item.files[0].content).toContain('"trigger": "icon"');
  expect(item.files[0].content).toContain('"placement": "top"'); // unknown value falls back
  expect(item.files[0].content).toContain('"delay": 1000'); // clamped to the schema maximum
});
