import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["menu-bar"].variants);
const bar = (page: Page) => page.getByRole("menubar", { name: /Document|Editor/ });
const top = (page: Page, name: string) => bar(page).getByRole("menuitem", { name, exact: true });
const item = (page: Page, name: string) => page.getByRole("menu").getByRole("menuitem", { name });

for (const target of targets("menu-bar")) {
  test.describe(`menu bar — ${target.name} export`, () => {
    test("no axe violations for every variant, closed and open", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await top(page, "Edit").click();
      await expectNoAxeViolations(page);
    });

    test("it is a menubar of three menus, each saying it has something to open", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(bar(page)).toHaveAttribute("aria-orientation", "horizontal");
      await expect(bar(page).getByRole("menuitem")).toHaveCount(3);
      await expect(top(page, "File")).toHaveAttribute("aria-haspopup", "true");
      await expect(top(page, "File")).toHaveAttribute("aria-expanded", "false");
    });

    test("one tab stop for the whole bar", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(top(page, "File")).toHaveAttribute("tabindex", "0");
      await expect(top(page, "Edit")).toHaveAttribute("tabindex", "-1");
      await expect(top(page, "View")).toHaveAttribute("tabindex", "-1");
    });

    test("arrows move along the bar and the tab stop moves with the focus", async ({ page }) => {
      await open(page, target.url("default"));
      await top(page, "File").focus();
      await page.keyboard.press("ArrowRight");
      await expect(top(page, "Edit")).toBeFocused();
      await expect(top(page, "Edit")).toHaveAttribute("tabindex", "0");
      await expect(top(page, "File")).toHaveAttribute("tabindex", "-1");
      // It wraps rather than stopping.
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowRight");
      await expect(top(page, "File")).toBeFocused();
    });

    test("Down opens a menu on its first item, Up on its last", async ({ page }) => {
      await open(page, target.url("default"));
      await top(page, "File").focus();
      await page.keyboard.press("ArrowDown");
      await expect(top(page, "File")).toHaveAttribute("aria-expanded", "true");
      await expect(item(page, "New draft")).toBeFocused();
      await page.keyboard.press("Escape");
      await page.keyboard.press("ArrowUp");
      await expect(item(page, "Export as Markdown")).toBeFocused();
    });

    test("inside a menu the arrows wrap, and Home and End jump", async ({ page }) => {
      await open(page, target.url("default"));
      await top(page, "Edit").click();
      await expect(item(page, "Undo")).toBeFocused();
      await page.keyboard.press("ArrowUp");
      await expect(item(page, "Find in document")).toBeFocused();
      await page.keyboard.press("Home");
      await expect(item(page, "Undo")).toBeFocused();
      await page.keyboard.press("End");
      await expect(item(page, "Find in document")).toBeFocused();
    });

    test("sideways from inside a menu moves to the next menu, already open", async ({ page }) => {
      await open(page, target.url("default"));
      await top(page, "File").click();
      await page.keyboard.press("ArrowRight");
      await expect(top(page, "Edit")).toHaveAttribute("aria-expanded", "true");
      await expect(top(page, "File")).toHaveAttribute("aria-expanded", "false");
      await expect(item(page, "Undo")).toBeFocused();
    });

    test("a typed letter jumps to the next item starting with it", async ({ page }) => {
      await open(page, target.url("default"));
      await top(page, "File").click();
      await page.keyboard.press("e");
      await expect(item(page, "Export as Markdown")).toBeFocused();
    });

    test("Escape closes the menu and gives focus back to its button", async ({ page }) => {
      await open(page, target.url("default"));
      await top(page, "View").click();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("menu")).toHaveCount(0);
      await expect(top(page, "View")).toBeFocused();
    });

    test("choosing an item says which, closes, and returns focus", async ({ page }) => {
      await open(page, target.url("default"));
      await top(page, "Edit").click();
      await item(page, "Redo").click();
      await expect(page.getByRole("menu")).toHaveCount(0);
      await expect(page.getByRole("status")).toHaveText("Chose: Redo");
      await expect(top(page, "Edit")).toBeFocused();
    });

    test("bare variant: its own name and no shortcuts shown", async ({ page }) => {
      await open(page, target.url("bare"));
      await expect(page.getByRole("menubar", { name: "Editor" })).toBeVisible();
      await page.getByRole("menubar").getByRole("menuitem").first().click();
      await expect(page.locator("kbd")).toHaveCount(0);
    });
  });
}

test("registry serves the menu bar with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/menu-bar.json?label=Editor&showShortcuts=false")).json();
  expect(item).toMatchObject({ name: "menu-bar", type: "registry:component" });
  expect(item.files[0].content).toContain('"label": "Editor"');
  expect(item.files[0].content).toContain('"showShortcuts": false');
});
