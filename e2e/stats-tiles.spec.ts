import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["stats-tiles"].variants);
const terms = (page: Page) => page.locator("dt");

for (const target of targets("stats-tiles")) {
  test.describe(`stats tiles — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("every tile is a term and a value in one description list", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(terms(page)).toHaveCount(4);
      await expect(terms(page).first()).toHaveText("Signed up");
      await expect(page.locator("dd").first()).toContainText("128");
    });

    test("the change is in words, not only in a colour", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByText("12 more than last week")).toBeVisible();
      await expect(page.getByText("3 fewer than last week")).toBeVisible();
      await expect(page.getByText("the same as last week")).toBeVisible();
    });

    test("the arrows are hidden from the accessibility tree", async ({ page }) => {
      await open(page, target.url("default"));
      const arrows = page.locator("dd span[aria-hidden=true]");
      await expect(arrows).toHaveCount(4);
      await expect(arrows.first()).toHaveText("↑");
      // The arrow is decoration; the change itself is in the words next to it.
      await expect(page.locator("dd").first()).toContainText("12 more than last week");
    });

    test("pair variant: two columns and no change lines", async ({ page }) => {
      await open(page, target.url("pair"));
      await expect(page.getByText("12 more than last week")).toHaveCount(0);
      await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
    });
  });
}

test("registry serves the stats tiles with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/stats-tiles.json?columns=three&showChange=false")).json();
  expect(item).toMatchObject({ name: "stats-tiles", type: "registry:component" });
  expect(item.files[0].content).toContain('"columns": "three"');
  expect(item.files[0].content).toContain('"showChange": false');
});
