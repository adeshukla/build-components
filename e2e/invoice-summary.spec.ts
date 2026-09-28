import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["invoice-summary"].variants);
const cell = (page: Page, name: string) => page.locator(`[data-${name}]`);

for (const target of targets("invoice-summary")) {
  test.describe(`invoice summary — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("it is a captioned table with a row header per line", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("table", { name: /Invoice 1042/ })).toBeVisible();
      await expect(page.getByRole("rowheader", { name: "Accessibility audit" })).toBeVisible();
    });

    test("the amounts are worked out, and they add up", async ({ page }) => {
      await open(page, target.url("default"));
      // 4 × £95 = £380, 1 × £1,200, 2 × £95 = £190 → £1,770 plus 20% = £2,124.
      await expect(page.getByRole("cell", { name: "£380.00" })).toBeVisible();
      await expect(cell(page, "subtotal")).toHaveText("£1,770.00");
      await expect(cell(page, "tax")).toHaveText("£354.00");
      await expect(cell(page, "total")).toHaveText("£2,124.00");
    });

    test("the totals are in a real tfoot", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.locator("tfoot")).toBeVisible();
      await expect(page.locator("tfoot [data-total]")).toHaveText("£2,124.00");
    });

    test("the tax rate is in the label, not left unexplained", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("rowheader", { name: "VAT at 20%" })).toBeVisible();
    });

    test("money is grouped and always has two decimal places", async ({ page }) => {
      await open(page, target.url("default"));
      // Two cells hold it: the unit price and, for one line, the amount as well.
      await expect(page.getByRole("cell", { name: "£1,200.00" }).first()).toBeVisible();
    });

    test("a different rate changes the tax and the total, and nothing else", async ({ page }) => {
      await open(page, target.url("zero-rated"));
      await expect(cell(page, "subtotal")).toHaveText("£1,770.00");
      await expect(cell(page, "tax")).toHaveText("£0.00");
      await expect(cell(page, "total")).toHaveText("£1,770.00");
    });

    test("euro variant: its own symbol throughout", async ({ page }) => {
      await open(page, target.url("euro"));
      await expect(cell(page, "total")).toHaveText(/^€/);
    });
  });
}

test("registry serves the invoice summary with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/invoice-summary.json?taxPercent=0&currency=%E2%82%AC")).json();
  expect(item).toMatchObject({ name: "invoice-summary", type: "registry:component" });
  expect(item.files[0].content).toContain('"taxPercent": 0');
  expect(item.files[0].content).toContain('"currency": "€"');
});
