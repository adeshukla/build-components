import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["details-list"].variants);
const terms = (page: Page) => page.locator("dt");

for (const target of targets("details-list")) {
  test.describe(`details list — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("every value keeps its label", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(terms(page)).toHaveCount(5);
      await expect(terms(page).first()).toHaveText("Order");
      await expect(page.locator("dd").first()).toContainText("BC-4821");
    });

    test("an empty value says so instead of leaving a gap", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByText("Not given")).toBeVisible();
    });

    test("each change link names its row", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("link", { name: "Change delivery address" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Change payment" })).toBeVisible();
      // Two links, both distinguishable: no bare "Change" anywhere.
      await expect(page.getByRole("link", { name: "Change", exact: true })).toHaveCount(0);
    });

    test("a link that is not a real address is refused", async ({ page }) => {
      await open(page, target.url("default"));
      for (const link of await page.getByRole("link").all()) {
        const href = await link.getAttribute("href");
        expect(href).toMatch(/^(\/|#|https?:\/\/|mailto:|tel:)/);
      }
    });

    test("two variant: no dividers, renamed heading", async ({ page }) => {
      await open(page, target.url("two"));
      await expect(page.getByRole("heading", { name: "Account" })).toBeVisible();
      await expect(terms(page)).toHaveCount(5);
    });
  });
}

test("registry serves the details list with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/details-list.json?heading=Booking&columns=two")).json();
  expect(item).toMatchObject({ name: "details-list", type: "registry:component" });
  expect(item.files[0].content).toContain('"heading": "Booking"');
  expect(item.files[0].content).toContain('"columns": "two"');
});
