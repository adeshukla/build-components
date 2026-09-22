import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["resizable-panels"].variants);
const divider = (page: Page) => page.getByRole("separator", { name: "Resize the file list" });

for (const target of targets("resizable-panels")) {
  test.describe(`resizable panels — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("the divider is a focusable separator with its value", async ({ page }) => {
      await open(page, target.url("default"));
      await page.keyboard.press("Tab");
      await expect(divider(page)).toBeFocused();
      await expect(divider(page)).toHaveAttribute("aria-valuenow", "35");
      await expect(divider(page)).toHaveAttribute("aria-valuetext", "Files 35%");
      await expect(divider(page)).toHaveAttribute("aria-orientation", "vertical");
    });

    test("arrows, Home and End resize within the limits", async ({ page }) => {
      await open(page, target.url("default"));
      await divider(page).focus();
      await page.keyboard.press("ArrowRight");
      await expect(divider(page)).toHaveAttribute("aria-valuenow", "40");
      await page.keyboard.press("End");
      await expect(divider(page)).toHaveAttribute("aria-valuenow", "70");
      await page.keyboard.press("ArrowRight");
      await expect(divider(page)).toHaveAttribute("aria-valuenow", "70");
      await page.keyboard.press("Home");
      await expect(divider(page)).toHaveAttribute("aria-valuenow", "20");
    });

    test("Enter collapses the first panel and brings it back", async ({ page }) => {
      await open(page, target.url("default"));
      await divider(page).focus();
      await page.keyboard.press("Enter");
      await expect(divider(page)).toHaveAttribute("aria-valuenow", "0");
      await expect(divider(page)).toHaveAttribute("aria-valuetext", "Files collapsed");
      await expect(page.getByRole("region", { name: "Files" })).toBeHidden();
      await expect(divider(page)).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(divider(page)).toHaveAttribute("aria-valuenow", "35");
      await expect(page.getByRole("region", { name: "Files" })).toBeVisible();
    });

    test("dragging the divider resizes", async ({ page }) => {
      await open(page, target.url("default"));
      const box = await divider(page).boundingBox();
      const container = await page.getByRole("region", { name: "Preview" }).boundingBox();
      await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
      await page.mouse.down();
      await page.mouse.move(container!.x + container!.width - 20, box!.y + box!.height / 2, { steps: 8 });
      await page.mouse.up();
      await expect(divider(page)).toHaveAttribute("aria-valuenow", "70");
    });

    test("vertical variant: up and down, no collapsing", async ({ page }) => {
      await open(page, target.url("vertical"));
      await divider(page).focus();
      await expect(divider(page)).toHaveAttribute("aria-orientation", "horizontal");
      await page.keyboard.press("ArrowDown");
      await expect(divider(page)).toHaveAttribute("aria-valuenow", "55");
      await page.keyboard.press("Enter");
      await expect(divider(page)).toHaveAttribute("aria-valuenow", "55");
    });
  });
}

test("registry serves the resizable panels with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/resizable-panels.json?orientation=vertical&step=500")).json();
  expect(item).toMatchObject({ name: "resizable-panels", type: "registry:component" });
  expect(item.files[0].content).toContain('"orientation": "vertical"');
  expect(item.files[0].content).toContain('"step": 25'); // clamped to the schema maximum
});
