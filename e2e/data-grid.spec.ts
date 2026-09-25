import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["data-grid"].variants);
const header = (page: Page, name: string) => page.getByRole("columnheader", { name: new RegExp(name) });
const firstRowOwner = (page: Page) => page.getByRole("row").nth(1).getByRole("cell").first();

for (const target of targets("data-grid")) {
  test.describe(`data grid — ${target.name} export`, () => {
    test("no axe violations for every variant, sorted and unsorted", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await page.getByRole("button", { name: /Owner/ }).click();
      await expectNoAxeViolations(page);
    });

    test("sorting reports aria-sort, reorders the rows and says what happened", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(header(page, "Name")).toHaveAttribute("aria-sort", "none");
      await page.getByRole("button", { name: /Owner/ }).click();
      await expect(header(page, "Owner")).toHaveAttribute("aria-sort", "ascending");
      await expect(firstRowOwner(page)).toHaveText("Ade");
      await expect(page.getByRole("status")).toHaveText("Sorted by Owner, ascending");
      await page.getByRole("button", { name: /Owner/ }).click();
      await expect(header(page, "Owner")).toHaveAttribute("aria-sort", "descending");
      await expect(firstRowOwner(page)).toHaveText("Sam");
    });

    test("columns resize with the arrow keys, not only by dragging", async ({ page }) => {
      await open(page, target.url("default"));
      const handle = page.getByRole("separator", { name: "Name column width" });
      await expect(handle).toHaveAttribute("aria-valuenow", "220");
      await handle.focus();
      await page.keyboard.press("ArrowRight");
      await expect(handle).toHaveAttribute("aria-valuenow", "236");
      await page.keyboard.press("ArrowLeft");
      await page.keyboard.press("ArrowLeft");
      await expect(handle).toHaveAttribute("aria-valuetext", "204 pixels");
      await page.keyboard.press("Home");
      await expect(handle).toHaveAttribute("aria-valuenow", "220");
    });

    test("it is a real table: caption, column headers and a row header", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("table")).toContainText("Documents");
      await expect(page.getByRole("columnheader")).toHaveCount(4);
      await expect(page.getByRole("rowheader", { name: "Anchor plan" })).toBeVisible();
    });

    test("plain variant: no sorting, no resize handles", async ({ page }) => {
      await open(page, target.url("plain"));
      await expect(page.getByRole("separator")).toHaveCount(0);
      await expect(page.getByRole("button")).toHaveCount(0);
      await expect(header(page, "Name")).not.toHaveAttribute("aria-sort", /.*/);
    });
  });
}

test("registry serves the data grid with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/data-grid.json?caption=Bookings&sortable=false")).json();
  expect(item).toMatchObject({ name: "data-grid", type: "registry:component" });
  expect(item.files[0].content).toContain('"caption": "Bookings"');
  expect(item.files[0].content).toContain('"sortable": false');
});
