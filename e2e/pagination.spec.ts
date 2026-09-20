import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.pagination.variants);
const page5 = (page: Page) => page.getByRole("button", { name: "Page 5", exact: true });

for (const target of targets("pagination")) {
  test.describe(`pagination — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("the set is named, and the current page says so", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("navigation", { name: "Orders" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Page 4", exact: true })).toHaveAttribute("aria-current", "page");
      await expect(page.getByText("Page 4 of 12")).toBeVisible();
    });

    test("only the near pages and the ends are shown, with a gap between", async ({ page }) => {
      await open(page, target.url("default"));
      // 1 … 3 4 5 … 12 with one page either side.
      for (const number of ["Page 1", "Page 3", "Page 4", "Page 5", "Page 12"]) {
        await expect(page.getByRole("button", { name: number, exact: true })).toBeVisible();
      }
      await expect(page.getByRole("button", { name: "Page 7", exact: true })).toHaveCount(0);
      // The gap is decoration: never a control, never announced.
      await expect(page.locator("li[aria-hidden='true']").first()).toBeVisible();
    });

    test("next and previous move a page, and the count follows", async ({ page }) => {
      await open(page, target.url("default"));
      await page.getByRole("button", { name: "Next" }).click();
      await expect(page5(page)).toHaveAttribute("aria-current", "page");
      await expect(page.getByText("Page 5 of 12")).toBeVisible();

      await page.getByRole("button", { name: "Previous" }).click();
      await expect(page.getByRole("button", { name: "Page 4", exact: true })).toHaveAttribute("aria-current", "page");
    });

    test("the ends stop rather than wrap", async ({ page }) => {
      await open(page, target.url("default"));
      await page.getByRole("button", { name: "First" }).click();
      await expect(page.getByRole("button", { name: "Previous" })).toBeDisabled();
      await expect(page.getByRole("button", { name: "First" })).toBeDisabled();

      await page.getByRole("button", { name: "Last" }).click();
      await expect(page.getByRole("button", { name: "Next" })).toBeDisabled();
      await expect(page.getByText("Page 12 of 12")).toBeVisible();
    });

    test("picking a page number goes there", async ({ page }) => {
      await open(page, target.url("default"));
      await page.getByRole("button", { name: "Page 12", exact: true }).click();
      await expect(page.getByText("Page 12 of 12")).toBeVisible();
    });

    test("links variant: every page is a real link", async ({ page }) => {
      await open(page, target.url("links"));
      const four = page.getByRole("link", { name: "Page 4", exact: true });
      await expect(four).toHaveAttribute("href", "/orders?page=4");
      await expect(four).toHaveAttribute("aria-current", "page");
      await expect(page.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/orders?page=5");
    });

    test("compact variant: no numbers, just the way forward and back", async ({ page }) => {
      await open(page, target.url("compact"));
      await expect(page.getByRole("button", { name: "Page 4", exact: true })).toHaveCount(0);
      await expect(page.getByText("Page 4 of 12")).toBeVisible();
      await page.getByRole("button", { name: "Older" }).click();
      await expect(page.getByText("Page 5 of 12")).toBeVisible();
    });
  });
}

test("registry serves the pagination with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/pagination.json?totalPages=999&siblings=9&look=fancy")).json();
  expect(item).toMatchObject({ name: "pagination", type: "registry:component" });
  expect(item.files[0].content).toContain('"totalPages": 200'); // clamped to the schema maximum
  expect(item.files[0].content).toContain('"siblings": 4');
  expect(item.files[0].content).toContain('"look": "numbers"'); // unknown value falls back
});
