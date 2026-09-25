import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["toolbar"].variants);
const bar = (page: Page) => page.getByRole("toolbar");
const item = (page: Page, name: string) => page.getByRole("button", { name, exact: true });

for (const target of targets("toolbar")) {
  test.describe(`toolbar — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("the whole bar is one tab stop", async ({ page }) => {
      await open(page, target.url("default"));
      const tabbable = page.locator("[role=toolbar] button[tabindex='0']");
      await expect(tabbable).toHaveCount(1);
      await expect(page.locator("[role=toolbar] button[tabindex='-1']")).toHaveCount(5);
    });

    test("the arrow keys move inside it, and wrap around", async ({ page }) => {
      await open(page, target.url("default"));
      await item(page, "Bold").focus();
      await page.keyboard.press("ArrowRight");
      await expect(item(page, "Italic")).toBeFocused();
      await page.keyboard.press("ArrowLeft");
      await expect(item(page, "Bold")).toBeFocused();
      await page.keyboard.press("ArrowLeft");
      await expect(item(page, "Clear formatting")).toBeFocused();
    });

    test("Home and End reach the ends", async ({ page }) => {
      await open(page, target.url("default"));
      await item(page, "Italic").focus();
      await page.keyboard.press("End");
      await expect(item(page, "Clear formatting")).toBeFocused();
      await page.keyboard.press("Home");
      await expect(item(page, "Bold")).toBeFocused();
    });

    test("the tab stop follows the item you used last", async ({ page }) => {
      await open(page, target.url("default"));
      await item(page, "Undo").focus();
      await expect(item(page, "Undo")).toHaveAttribute("tabindex", "0");
      await expect(item(page, "Bold")).toHaveAttribute("tabindex", "-1");
    });

    test("toggles report on and off; actions just happen", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(item(page, "Bold")).toHaveAttribute("aria-pressed", "false");
      await item(page, "Bold").click();
      await expect(item(page, "Bold")).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByRole("status")).toHaveText("Bold on");
      await item(page, "Bold").click();
      await expect(page.getByRole("status")).toHaveText("Bold off");
      await item(page, "Undo").click();
      await expect(item(page, "Undo")).not.toHaveAttribute("aria-pressed", /.*/);
      await expect(page.getByRole("status")).toHaveText("Undo done");
    });

    test("vertical variant: up and down move instead", async ({ page }) => {
      await open(page, target.url("vertical"));
      await expect(bar(page)).toHaveAttribute("aria-orientation", "vertical");
      await item(page, "Bold").focus();
      await page.keyboard.press("ArrowDown");
      await expect(item(page, "Italic")).toBeFocused();
    });
  });
}

test("registry serves the toolbar with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/toolbar.json?label=Editing&orientation=vertical")).json();
  expect(item).toMatchObject({ name: "toolbar", type: "registry:component" });
  expect(item.files[0].content).toContain('"label": "Editing"');
  expect(item.files[0].content).toContain('"orientation": "vertical"');
});
