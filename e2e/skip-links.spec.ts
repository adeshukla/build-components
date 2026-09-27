import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["skip-links"].variants);
const first = (page: Page) => page.getByRole("link", { name: "Skip to main content" });

for (const target of targets("skip-links")) {
  test.describe(`skip links — ${target.name} export`, () => {
    test("no axe violations for every variant, hidden and focused", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await first(page).focus();
      await expectNoAxeViolations(page);
    });

    test("they are links in a named nav, and there is one per target", async ({ page }) => {
      await open(page, target.url("default"));
      const nav = page.getByRole("navigation", { name: "Skip links" });
      await expect(nav).toBeAttached();
      await expect(nav.getByRole("link")).toHaveCount(3);
    });

    test("hidden by size, not taken out of the tab order", async ({ page }) => {
      await open(page, target.url("default"));
      const box = await first(page).boundingBox();
      expect(box?.width).toBeLessThan(4);
      // Still reachable: if it were display:none or visibility:hidden, focus could never land on it.
      await first(page).focus();
      await expect(first(page)).toBeFocused();
      const shown = await first(page).boundingBox();
      expect(shown?.width ?? 0).toBeGreaterThan(80);
      expect(shown?.height ?? 0).toBeGreaterThanOrEqual(44);
    });

    test("following one moves focus into the landmark, not just the scroll position", async ({ page }) => {
      await open(page, target.url("default"));
      await first(page).focus();
      await page.keyboard.press("Enter");
      const landmark = page.locator("#main-content");
      await expect(landmark).toBeFocused();
      await expect(landmark).toHaveAttribute("tabindex", "-1");
    });

    test("each label names where it goes", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("link", { name: "Skip to navigation" })).toBeAttached();
      await expect(page.getByRole("link", { name: "Skip to search" })).toBeAttached();
    });

    test("always-visible variant: shown without focus, same links", async ({ page }) => {
      await open(page, target.url("always"));
      await expect(first(page)).toBeVisible();
      const box = await first(page).boundingBox();
      expect(box?.width ?? 0).toBeGreaterThan(80);
    });
  });
}

test("registry serves the skip links with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/skip-links.json?alwaysVisible=true&position=top-centre")).json();
  expect(item).toMatchObject({ name: "skip-links", type: "registry:component" });
  expect(item.files[0].content).toContain('"alwaysVisible": true');
  expect(item.files[0].content).toContain('"position": "top-centre"');
});
