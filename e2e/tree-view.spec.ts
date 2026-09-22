import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["tree-view"].variants);
const item = (page: Page, name: string) => page.getByRole("treeitem", { name, exact: true });

for (const target of targets("tree-view")) {
  test.describe(`tree view — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("one Tab stop; items carry their level, position and open state", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("tree", { name: "Project files" })).toBeVisible();
      await page.keyboard.press("Tab");
      const src = item(page, "src");
      await expect(src).toBeFocused();
      await expect(src).toHaveAttribute("aria-expanded", "true");
      await expect(src).toHaveAttribute("aria-level", "1");
      await expect(src).toHaveAttribute("aria-posinset", "1");
      await expect(src).toHaveAttribute("aria-setsize", "4");
      await expect(item(page, "app")).toHaveAttribute("aria-expanded", "false");
      await expect(page.locator('[role="treeitem"][tabindex="0"]')).toHaveCount(1);
    });

    test("the arrow keys walk, open and close folders", async ({ page }) => {
      await open(page, target.url("default"));
      await item(page, "src").focus();
      await page.keyboard.press("ArrowDown");
      await expect(item(page, "app")).toBeFocused();
      await page.keyboard.press("ArrowRight"); // opens app
      await expect(item(page, "app")).toHaveAttribute("aria-expanded", "true");
      await page.keyboard.press("ArrowRight"); // into app
      await expect(item(page, "layout.tsx")).toBeFocused();
      await expect(item(page, "layout.tsx")).toHaveAttribute("aria-level", "3");
      await page.keyboard.press("ArrowLeft"); // back to app
      await expect(item(page, "app")).toBeFocused();
      await page.keyboard.press("ArrowLeft"); // closes app
      await expect(item(page, "app")).toHaveAttribute("aria-expanded", "false");
      await expect(item(page, "layout.tsx")).toBeHidden();
      await page.keyboard.press("End");
      await expect(item(page, "README.md")).toBeFocused();
      await page.keyboard.press("Home");
      await expect(item(page, "src")).toBeFocused();
    });

    test("type-ahead, * and selection", async ({ page }) => {
      await open(page, target.url("default"));
      await item(page, "src").focus();
      await page.keyboard.press("p"); // public
      await expect(item(page, "public")).toBeFocused();
      await page.keyboard.press("p"); // package.json
      await expect(item(page, "package.json")).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(item(page, "package.json")).toHaveAttribute("aria-selected", "true");
      await expect(page.getByText("Selected: package.json")).toBeVisible();

      await item(page, "app").focus();
      await page.keyboard.press("*"); // opens app, components and lib
      for (const name of ["app", "components", "lib"]) {
        await expect(item(page, name)).toHaveAttribute("aria-expanded", "true");
      }
    });

    test("a click selects and toggles a folder", async ({ page }) => {
      await open(page, target.url("default"));
      await page.getByText("components", { exact: true }).click();
      await expect(item(page, "components")).toHaveAttribute("aria-expanded", "true");
      await expect(item(page, "components")).toHaveAttribute("aria-selected", "true");
      await expect(item(page, "button.tsx")).toBeVisible();
    });
  });
}

test("registry serves the tree view with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/tree-view.json?startOpen=all&label=Docs")).json();
  expect(item).toMatchObject({ name: "tree-view", type: "registry:component" });
  expect(item.files[0].content).toContain('"startOpen": "all"');
  expect(item.files[0].content).toContain('"label": "Docs"');
});
