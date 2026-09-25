import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["pricing-table"].variants);
// The radio itself is visually hidden, so a person clicks its label — and so does this.
const yearly = (page: Page) => page.getByText("Yearly", { exact: true });
const crewPrice = (page: Page) => page.getByRole("listitem").filter({ hasText: "Crew" }).getByText(/^£\d+$/);

for (const target of targets("pricing-table")) {
  test.describe(`pricing table — ${target.name} export`, () => {
    test("no axe violations for every variant, both cycles", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await yearly(page).click();
      await expectNoAxeViolations(page);
    });

    test("the cycle is a radio group and switching changes every price", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("radio", { name: "Monthly" })).toBeChecked();
      await expect(crewPrice(page)).toHaveText("£29");
      await yearly(page).click();
      await expect(crewPrice(page)).toHaveText("£290");
      await expect(page.getByRole("status")).toHaveText("Showing yearly prices");
      await expect(page.getByText("Two months off when you pay for a year.")).toBeVisible();
    });

    test("each button names its plan and the highlighted plan says so in words", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("button", { name: "Choose Crew" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Choose Fleet" })).toBeVisible();
      await expect(page.getByRole("heading", { name: /Crew/ })).toContainText("Most picked");
    });

    test("quiet variant: no cycle switch, nothing highlighted", async ({ page }) => {
      await open(page, target.url("quiet"));
      await expect(page.getByRole("radio")).toHaveCount(0);
      await expect(page.getByText("Most picked")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Choose Solo" })).toBeVisible();
    });
  });
}

test("registry serves the pricing table with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/pricing-table.json?currency=%24&showCycle=false")).json();
  expect(item).toMatchObject({ name: "pricing-table", type: "registry:component" });
  expect(item.files[0].content).toContain('"currency": "$"');
  expect(item.files[0].content).toContain('"showCycle": false');
});
