import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.tabs.variants);
const tab = (page: Page, name: string) => page.getByRole("tab", { name });
const panel = (page: Page) => page.getByRole("tabpanel");

for (const target of targets("tabs")) {
  test.describe(`tabs — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("the first tab is selected, and only its panel is shown", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("tablist", { name: "Plan details" })).toBeVisible();
      await expect(tab(page, "Overview")).toHaveAttribute("aria-selected", "true");
      await expect(panel(page)).toHaveCount(1); // hidden panels are not in the tree
      await expect(panel(page)).toContainText("Everything a small team needs");

      // Only the selected tab is in the tab order (roving tabindex).
      await expect(tab(page, "Overview")).toHaveAttribute("tabindex", "0");
      await expect(tab(page, "Pricing")).toHaveAttribute("tabindex", "-1");
    });

    test("clicking a tab shows its panel", async ({ page }) => {
      await open(page, target.url("default"));
      await tab(page, "Support").click();
      await expect(tab(page, "Support")).toHaveAttribute("aria-selected", "true");
      await expect(tab(page, "Overview")).toHaveAttribute("aria-selected", "false");
      await expect(panel(page)).toContainText("Email support on working days");
    });

    test("arrow keys move and select, and wrap at both ends", async ({ page }) => {
      await open(page, target.url("default"));
      await tab(page, "Overview").focus();

      await page.keyboard.press("ArrowRight");
      await expect(tab(page, "Pricing")).toBeFocused();
      await expect(panel(page)).toContainText("£12 per person"); // automatic activation

      await page.keyboard.press("End");
      await expect(tab(page, "Support")).toBeFocused();
      await page.keyboard.press("ArrowRight"); // wraps to the first
      await expect(tab(page, "Overview")).toBeFocused();
      await page.keyboard.press("ArrowLeft"); // wraps back to the last
      await expect(tab(page, "Support")).toBeFocused();
      await page.keyboard.press("Home");
      await expect(tab(page, "Overview")).toBeFocused();
    });

    test("the panel itself can take focus, so its text is reachable", async ({ page }) => {
      await open(page, target.url("default"));
      await tab(page, "Overview").focus();
      await page.keyboard.press("Tab");
      await expect(panel(page)).toBeFocused();
    });

    test("manual variant: moving does not switch the panel until Enter", async ({ page }) => {
      await open(page, target.url("manual"));
      await expect(page.getByRole("tablist", { name: "Account" })).toHaveAttribute("aria-orientation", "vertical");
      await tab(page, "Overview").focus();

      await page.keyboard.press("ArrowDown"); // vertical: Down is the next tab
      await expect(tab(page, "Pricing")).toBeFocused();
      await expect(tab(page, "Pricing")).toHaveAttribute("aria-selected", "false");
      await expect(panel(page)).toContainText("Everything a small team needs");

      await page.keyboard.press("Enter");
      await expect(tab(page, "Pricing")).toHaveAttribute("aria-selected", "true");
      await expect(panel(page)).toContainText("£12 per person");
    });
  });
}

test("registry serves the tabs with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/tabs.json?activation=whenever&radius=999&look=pill")).json();
  expect(item).toMatchObject({ name: "tabs", type: "registry:component" });
  expect(item.files[0].content).toContain('"look": "pill"');
  expect(item.files[0].content).toContain('"activation": "automatic"'); // unknown value falls back
  expect(item.files[0].content).toContain('"radius": 24'); // clamped to the schema maximum
});
