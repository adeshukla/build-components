import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.menu.variants);
const opener = (page: Page, name = "Actions") => page.getByRole("button", { name, exact: false });
const item = (page: Page, name: string) => page.getByRole("menuitem", { name });

for (const target of targets("menu")) {
  test.describe(`dropdown menu — ${target.name} export`, () => {
    test("no axe violations, closed and open, for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
        await page.getByRole("button").first().click();
        await expectNoAxeViolations(page);
      }
    });

    test("the button says it opens a menu, and the items are hidden until it does", async ({ page }) => {
      await open(page, target.url("default"));
      const button = opener(page);
      await expect(button).toHaveAttribute("aria-haspopup", "true");
      await expect(button).toHaveAttribute("aria-expanded", "false");
      await expect(page.getByRole("menu")).toBeHidden();

      await button.click();
      await expect(button).toHaveAttribute("aria-expanded", "true");
      await expect(page.getByRole("menu", { name: "Actions" })).toBeVisible();
      await expect(page.getByRole("menuitem")).toHaveCount(5);
      await expect(item(page, "Edit details")).toBeFocused();
    });

    test("arrow keys move and wrap, Home and End jump to the ends", async ({ page }) => {
      await open(page, target.url("default"));
      await opener(page).click();

      await expect(item(page, "Edit details")).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(item(page, "Duplicate")).toBeFocused();
      await page.keyboard.press("End");
      await expect(item(page, "Delete")).toBeFocused();
      await page.keyboard.press("ArrowDown"); // wraps to the first
      await expect(item(page, "Edit details")).toBeFocused();
      await page.keyboard.press("ArrowUp"); // wraps back to the last
      await expect(item(page, "Delete")).toBeFocused();
      await page.keyboard.press("Home");
      await expect(item(page, "Edit details")).toBeFocused();
    });

    test("Arrow Up on the button opens at the last item", async ({ page }) => {
      await open(page, target.url("default"));
      await opener(page).focus();
      await page.keyboard.press("ArrowUp");
      await expect(item(page, "Delete")).toBeFocused();
    });

    test("typing jumps to the item that starts with it", async ({ page }) => {
      await open(page, target.url("default"));
      await opener(page).click();
      await expect(item(page, "Edit details")).toBeFocused();
      await page.keyboard.press("m");
      await expect(item(page, "Move to archive")).toBeFocused();
    });

    test("Escape closes the menu and puts focus back on the button", async ({ page }) => {
      await open(page, target.url("default"));
      await opener(page).click();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("menu")).toBeHidden();
      await expect(opener(page)).toBeFocused();
    });

    test("choosing an item closes the menu", async ({ page }) => {
      await open(page, target.url("default"));
      await opener(page).click();
      await item(page, "Duplicate").click();
      await expect(page.getByRole("menu")).toBeHidden();
      await expect(opener(page)).toBeFocused();
    });

    test("no type-ahead variant: typing does not move focus", async ({ page }) => {
      await open(page, target.url("plain"));
      await opener(page, "Options").click();
      await expect(item(page, "Rename")).toBeFocused();
      await page.keyboard.press("d");
      await expect(item(page, "Rename")).toBeFocused();
    });
  });
}

test("registry serves the menu with config from the URL", async ({ request }) => {
  const query = new URLSearchParams({
    items: JSON.stringify([{ label: "Evil", href: "javascript:alert(1)" }]),
    align: "middle",
  });
  const item = await (await request.get(`/r/menu.json?${query}`)).json();
  expect(item).toMatchObject({ name: "menu", type: "registry:component" });
  expect(item.files[0].content).not.toContain("javascript:");
  expect(item.files[0].content).toContain('"href": "#"');
  expect(item.files[0].content).toContain('"align": "start"'); // unknown value falls back
});
