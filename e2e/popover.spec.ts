import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.popover.variants);
const trigger = (page: Page, name: string) => page.getByRole("button", { name });

for (const target of targets("popover")) {
  test.describe(`popover — ${target.name} export`, () => {
    test("no axe violations, closed and open, for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
        await page.getByRole("button").first().click();
        await expectNoAxeViolations(page);
      }
    });

    test("opening it moves focus inside, and it is announced as a dialog", async ({ page }) => {
      await open(page, target.url("default"));
      const button = trigger(page, "Share this page");
      await expect(page.getByRole("dialog")).toBeHidden();

      await button.click();
      await expect(button).toHaveAttribute("aria-expanded", "true");
      await expect(page.getByRole("dialog", { name: "Share" })).toBeVisible();
      await expect(trigger(page, "Close")).toBeFocused();
      await expect(trigger(page, "Copy link")).toBeVisible();
    });

    test("everything inside can be reached by keyboard", async ({ page }) => {
      await open(page, target.url("default"));
      await trigger(page, "Share this page").click();
      await trigger(page, "Copy link").focus();
      await expect(trigger(page, "Copy link")).toBeFocused();
      await trigger(page, "Turn off sharing").focus();
      await expect(trigger(page, "Turn off sharing")).toBeFocused();
    });

    test("Escape closes it and focus returns to the trigger", async ({ page }) => {
      await open(page, target.url("default"));
      const button = trigger(page, "Share this page");
      await button.click();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toBeHidden();
      await expect(button).toBeFocused();
    });

    test("clicking outside closes it", async ({ page }) => {
      await open(page, target.url("default"));
      await trigger(page, "Share this page").click();
      await page.mouse.click(5, 400);
      await expect(page.getByRole("dialog")).toBeHidden();
    });

    test("sticky variant: an outside click leaves it open", async ({ page }) => {
      await open(page, target.url("sticky"));
      await trigger(page, "Filters").click();
      await page.mouse.click(5, 400);
      await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toBeHidden();
    });
  });
}

test("registry serves the popover with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/popover.json?placement=under&width=9999&closeButton=false")).json();
  expect(item).toMatchObject({ name: "popover", type: "registry:component" });
  expect(item.files[0].content).toContain('"closeButton": false');
  expect(item.files[0].content).toContain('"placement": "bottom"'); // unknown value falls back
  expect(item.files[0].content).toContain('"width": 520'); // clamped to the schema maximum
});
