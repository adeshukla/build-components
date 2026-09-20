import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.table.variants);
const column = (page: Page, name: string | RegExp) => page.getByRole("columnheader", { name });
const rowNames = async (page: Page) =>
  page.getByRole("rowheader").evaluateAll((cells) => cells.map((cell) => cell.textContent?.trim() ?? ""));

for (const target of targets("table")) {
  test.describe(`data table — ${target.name} export`, () => {
    // The full table, whichever device the project emulates.
    test.use({ viewport: { width: 1280, height: 900 } });

    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("the caption, the columns and every row are in the page", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("table", { name: "Orders this week" })).toBeVisible();
      await expect(page.getByRole("columnheader")).toHaveCount(6); // five columns plus the picker
      await expect(page.getByRole("row")).toHaveCount(5); // heading row plus four orders
      await expect(page.getByRole("rowheader", { name: "AB-1044" })).toBeVisible();
    });

    test("sorting reorders the rows and says which way", async ({ page }) => {
      await open(page, target.url("default"));
      expect(await rowNames(page)).toEqual(["AB-1042", "AB-1043", "AB-1044", "AB-1045"]);

      await page.getByRole("button", { name: /^Customer/ }).click();
      await expect(column(page, /Customer/)).toHaveAttribute("aria-sort", "ascending");
      expect(await rowNames(page)).toEqual(["AB-1042", "AB-1045", "AB-1043", "AB-1044"]);

      await page.getByRole("button", { name: /^Customer/ }).click();
      await expect(column(page, /Customer/)).toHaveAttribute("aria-sort", "descending");
      expect(await rowNames(page)).toEqual(["AB-1044", "AB-1043", "AB-1045", "AB-1042"]);
    });

    test("money sorts by value, not as text", async ({ page }) => {
      await open(page, target.url("default"));
      await page.getByRole("button", { name: /^Total/ }).click();
      // 24.50 < 68.00 < 186.00 < 412.75 — sorted as text it would read 186 first.
      expect(await rowNames(page)).toEqual(["AB-1043", "AB-1045", "AB-1042", "AB-1044"]);
    });

    test("only one column is sorted at a time", async ({ page }) => {
      await open(page, target.url("default"));
      await page.getByRole("button", { name: /^Customer/ }).click();
      await page.getByRole("button", { name: /^Items/ }).click();
      await expect(column(page, /Customer/)).toHaveAttribute("aria-sort", "none");
      await expect(column(page, /Items/)).toHaveAttribute("aria-sort", "ascending");
    });

    test("each row checkbox is named, and the count is announced", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByText("No rows selected")).toBeVisible();

      await page.getByRole("checkbox", { name: "Select AB-1043" }).check();
      await expect(page.getByText("1 of 4 rows selected")).toBeVisible();

      await page.getByRole("checkbox", { name: "Select all rows" }).check();
      await expect(page.getByText("4 of 4 rows selected")).toBeVisible();
      await page.getByRole("checkbox", { name: "Select all rows" }).uncheck();
      await expect(page.getByText("No rows selected")).toBeVisible();
    });

    test("plain variant: no sorting, no selection, and an empty table says so", async ({ page }) => {
      await open(page, target.url("plain"));
      await expect(page.getByRole("button", { name: /^Customer/ })).toHaveCount(0);
      await expect(page.getByRole("checkbox")).toHaveCount(0);

      await open(page, target.url("empty"));
      await expect(page.getByText("Nothing to show yet.")).toBeVisible();
      await expect(page.getByRole("table")).toHaveCount(0);
    });
  });
}

for (const target of targets("table")) {
  test.describe(`data table on a phone — ${target.name} export`, () => {
    test.use({ viewport: { width: 375, height: 780 } });

    test("no axe violations while stacked", async ({ page }) => {
      await open(page, target.url("default"));
      await expectNoAxeViolations(page);
    });

    test("rows stack into cards, and every value still says which column it is", async ({ page }) => {
      await open(page, target.url("default"));
      // The heading row is hidden: each cell carries its column name instead.
      await expect(page.getByRole("columnheader", { name: /Customer/ })).toBeHidden();
      await expect(page.getByRole("rowheader", { name: "AB-1044" })).toBeVisible();

      const labels = await page
        .locator("[data-label]")
        .evaluateAll((cells) => cells.map((cell) => cell.getAttribute("data-label")));
      expect(labels).toContain("Customer");
      expect(labels).toContain("Total");
    });

    test("selection still works, and is still announced", async ({ page }) => {
      await open(page, target.url("default"));
      await page.getByRole("checkbox", { name: "Select AB-1043" }).check();
      await expect(page.getByText("1 of 4 rows selected")).toBeVisible();
    });

    test("scroll variant: the table keeps its shape instead of stacking", async ({ page }) => {
      await open(page, target.url("plain"));
      // The heading row stays on a phone here, and the frame is the thing that scrolls.
      await expect(page.getByRole("columnheader", { name: "Customer" })).toBeVisible();
      const frame = page.locator(".tl-frame, [class*=overflow-x-auto]").first();
      await expect(frame).toHaveCSS("overflow-x", "auto");
    });
  });
}

test("registry serves the table with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/table.json?density=roomy&sortable=false&caption=Invoices")).json();
  expect(item).toMatchObject({ name: "table", type: "registry:component" });
  expect(item.files[0].content).toContain('"caption": "Invoices"');
  expect(item.files[0].content).toContain('"sortable": false');
  expect(item.files[0].content).toContain('"density": "comfortable"'); // unknown value falls back
});
