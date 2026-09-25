import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["filter-bar"].variants);
const chip = (page: Page, name: string) => page.getByRole("button", { name, exact: true });
const status = (page: Page) => page.getByRole("status");

for (const target of targets("filter-bar")) {
  test.describe(`filter bar — ${target.name} export`, () => {
    test("no axe violations for every variant, empty and with filters on", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
        await chip(page, "Blue").click();
        await chip(page, "Small").click();
        await expectNoAxeViolations(page);
      }
    });

    test("chips are toggles and the status line sums up what is on", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(status(page)).toHaveText("No filters applied");
      await expect(chip(page, "Blue")).toHaveAttribute("aria-pressed", "false");
      await chip(page, "Blue").click();
      await expect(chip(page, "Blue")).toHaveAttribute("aria-pressed", "true");
      await chip(page, "Small").click();
      await expect(status(page)).toHaveText("2 filters applied: Blue, Small");
      await chip(page, "Blue").click();
      await expect(status(page)).toHaveText("1 filter applied: Small");
    });

    test("removing a pill hands focus back to the chip it came from", async ({ page }) => {
      await open(page, target.url("default"));
      await chip(page, "Green").click();
      await page.getByRole("button", { name: "Remove filter Colour: Green" }).click();
      await expect(chip(page, "Green")).toBeFocused();
      await expect(chip(page, "Green")).toHaveAttribute("aria-pressed", "false");
      await expect(status(page)).toHaveText("No filters applied");
    });

    test("clear all empties the bar and moves focus to the first chip", async ({ page }) => {
      await open(page, target.url("default"));
      await chip(page, "Blue").click();
      await chip(page, "Large").click();
      await page.getByRole("button", { name: "Clear all" }).click();
      await expect(chip(page, "Blue")).toBeFocused();
      await expect(chip(page, "Large")).toHaveAttribute("aria-pressed", "false");
      await expect(page.getByRole("button", { name: "Clear all" })).toHaveCount(0);
    });

    test("plain variant: no pills, no clear all", async ({ page }) => {
      await open(page, target.url("plain"));
      await chip(page, "Blue").click();
      await expect(page.getByRole("list", { name: "Applied filters" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Clear all" })).toHaveCount(0);
      await expect(status(page)).toHaveText("1 filter applied: Blue");
    });
  });
}

test("registry serves the filter bar with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/filter-bar.json?label=Refine&showPills=false")).json();
  expect(item).toMatchObject({ name: "filter-bar", type: "registry:component" });
  expect(item.files[0].content).toContain('"label": "Refine"');
  expect(item.files[0].content).toContain('"showPills": false');
});
