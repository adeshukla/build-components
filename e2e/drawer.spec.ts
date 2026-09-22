import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.drawer.variants);
const trigger = (page: Page) => page.getByRole("button", { name: "Filters" });
const drawer = (page: Page) => page.getByRole("dialog", { name: "Filter results" });

for (const target of targets("drawer")) {
  test.describe(`drawer — ${target.name} export`, () => {
    test("no axe violations for every variant, closed and open", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
        await trigger(page).click();
        await expect(drawer(page)).toBeVisible();
        await expectNoAxeViolations(page);
      }
    });

    test("opens on its title, keeps focus inside, and Escape returns focus", async ({ page }) => {
      await open(page, target.url("default"));
      await trigger(page).click();
      await expect(page.getByRole("heading", { name: "Filter results" })).toBeFocused();
      await expect(drawer(page)).toHaveAccessibleDescription(/Nothing changes until/);

      // Close, four choices, Clear all, Show results: seven stops, then back to the start.
      for (let i = 0; i < 7; i++) await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: "Show results" })).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: "Close" })).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(page.getByRole("button", { name: "Show results" })).toBeFocused();

      await page.keyboard.press("Escape");
      await expect(drawer(page)).toBeHidden();
      await expect(trigger(page)).toBeFocused();
    });

    test("it hugs the right edge", async ({ page }) => {
      await open(page, target.url("default"));
      await trigger(page).click();
      await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)));
      const box = await drawer(page).boundingBox();
      const width = page.viewportSize()!.width;
      expect(Math.round(box!.x + box!.width)).toBe(width);
    });

    test("choices apply on the main button; Clear all empties them", async ({ page }) => {
      await open(page, target.url("default"));
      await trigger(page).click();
      await page.getByRole("checkbox", { name: "On sale" }).check();
      await page.getByRole("checkbox", { name: "Free delivery" }).check();
      await page.getByRole("button", { name: "Show results" }).click();
      await expect(drawer(page)).toBeHidden();
      await expect(page.getByRole("status")).toHaveText("Showing: On sale, Free delivery.");
      await expect(trigger(page)).toBeFocused();

      await trigger(page).click();
      await page.getByRole("button", { name: "Clear all" }).click();
      await expect(page.getByRole("checkbox", { name: "On sale" })).not.toBeChecked();
      await expect(drawer(page)).toBeVisible();
    });

    test("a click on the dimmed page closes it", async ({ page }) => {
      await open(page, target.url("default"));
      await trigger(page).click();
      await page.mouse.click(10, 10);
      await expect(drawer(page)).toBeHidden();
      await expect(trigger(page)).toBeFocused();
    });

    test("bottom variant: sits on the bottom edge", async ({ page }) => {
      await open(page, target.url("bottom"));
      await trigger(page).click();
      await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)));
      const box = await drawer(page).boundingBox();
      expect(Math.round(box!.y + box!.height)).toBe(page.viewportSize()!.height);
      await expect(page.getByRole("button", { name: "Clear all" })).toHaveCount(0);
    });
  });
}

test("registry serves the drawer with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/drawer.json?side=bottom&size=huge")).json();
  expect(item).toMatchObject({ name: "drawer", type: "registry:component" });
  expect(item.files[0].content).toContain('"side": "bottom"');
  expect(item.files[0].content).toContain('"size": "md"'); // unknown value falls back
});
