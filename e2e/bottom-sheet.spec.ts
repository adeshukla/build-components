import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["bottom-sheet"].variants);
const trigger = (page: Page) => page.getByRole("button", { name: /Choose a delivery slot|Pick a filter/ });
const sheet = (page: Page) => page.locator("dialog");
const handle = (page: Page) => page.getByRole("button", { name: /Make the sheet/ });
const height = (page: Page) => page.getByRole("status").filter({ hasText: "Sheet height" });

for (const target of targets("bottom-sheet")) {
  test.describe(`bottom sheet — ${target.name} export`, () => {
    test("no axe violations for every variant, closed and open at each height", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await trigger(page).click();
      await expectNoAxeViolations(page);
      await handle(page).click();
      await expectNoAxeViolations(page);
    });

    test("it is a native modal dialog named by its own heading", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(sheet(page)).toBeHidden();
      await trigger(page).click();
      await expect(sheet(page)).toBeVisible();
      await expect(sheet(page)).toHaveAccessibleName("Delivery slot");
    });

    test("the handle is a real button with a name in words", async ({ page }) => {
      await open(page, target.url("default"));
      await trigger(page).click();
      await expect(handle(page)).toBeVisible();
      const box = await handle(page).boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    });

    test("the heights change from the keyboard and are said in words", async ({ page }) => {
      await open(page, target.url("default"));
      await trigger(page).click();
      await expect(height(page)).toHaveText("Sheet height: half the screen.");
      await handle(page).focus();
      await page.keyboard.press("ArrowUp");
      await expect(height(page)).toHaveText("Sheet height: nearly the whole screen.");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      await expect(height(page)).toHaveText("Sheet height: a third of the screen. Already at its shortest.");
      await page.keyboard.press("End");
      await expect(height(page)).toHaveText("Sheet height: nearly the whole screen.");
      await page.keyboard.press("Home");
      await expect(height(page)).toContainText("a third of the screen");
    });

    test("the sheet's height actually changes with the detent", async ({ page }) => {
      await open(page, target.url("default"));
      await trigger(page).click();
      const half = (await sheet(page).boundingBox())?.height ?? 0;
      await handle(page).focus();
      await page.keyboard.press("ArrowUp");
      await expect(sheet(page)).toHaveAttribute("data-detent", "full");
      const full = (await sheet(page).boundingBox())?.height ?? 0;
      expect(full).toBeGreaterThan(half);
    });

    test("clicking the handle steps up and wraps back to the shortest", async ({ page }) => {
      await open(page, target.url("default"));
      await trigger(page).click();
      await handle(page).click();
      await expect(sheet(page)).toHaveAttribute("data-detent", "full");
      await handle(page).click();
      await expect(sheet(page)).toHaveAttribute("data-detent", "peek");
    });

    test("Escape closes it and gives focus back to the button", async ({ page }) => {
      await open(page, target.url("default"));
      await trigger(page).click();
      await page.keyboard.press("Escape");
      await expect(sheet(page)).toBeHidden();
      await expect(trigger(page)).toBeFocused();
      await expect(page.getByRole("status").filter({ hasText: "closed" })).toBeVisible();
    });

    test("confirming says so, closes, and returns focus", async ({ page }) => {
      await open(page, target.url("default"));
      await trigger(page).click();
      await page.getByRole("button", { name: "Use this slot" }).click();
      await expect(sheet(page)).toBeHidden();
      await expect(page.getByRole("status").filter({ hasText: "chosen" })).toBeVisible();
      await expect(trigger(page)).toBeFocused();
    });

    test("one-height variant: the handle only collapses, and nothing pretends otherwise", async ({ page }) => {
      await open(page, target.url("tall"));
      await trigger(page).click();
      await expect(sheet(page)).toHaveAttribute("data-detent", "full");
      await expect(page.getByRole("button", { name: "Make the sheet shorter" })).toBeVisible();
    });
  });
}

test("registry serves the bottom sheet with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/bottom-sheet.json?detents=full&title=Filters")).json();
  expect(item).toMatchObject({ name: "bottom-sheet", type: "registry:component" });
  expect(item.files[0].content).toContain('"detents": "full"');
  expect(item.files[0].content).toContain('"title": "Filters"');
});
