import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.rating.variants);
const star = (page: Page, name: string) => page.getByRole("radio", { name, exact: true });

for (const target of targets("rating")) {
  test.describe(`rating — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("picking: a radio group where each star says what it means", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("group", { name: "Rate this part" })).toBeVisible();
      await expect(star(page, "4 stars")).toBeChecked();
      await expect(star(page, "1 star")).toBeVisible();
      await expect(page.getByText("4 out of 5")).toBeVisible();
    });

    test("arrow keys move and pick, and the text follows", async ({ page }) => {
      await open(page, target.url("default"));
      await star(page, "4 stars").focus();
      await page.keyboard.press("ArrowRight");
      await expect(star(page, "5 stars")).toBeChecked();
      await expect(page.getByText("5 out of 5")).toBeVisible();
    });

    test("average: read out once, in full", async ({ page }) => {
      await open(page, target.url("average"));
      await expect(page.getByRole("img", { name: "4.2 out of 5" })).toBeVisible();
      await expect(page.getByRole("radio")).toHaveCount(0);
      await expect(page.getByText("128 ratings")).toBeVisible();
    });
  });
}

test("registry serves the rating with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/rating.json?mode=show&max=99")).json();
  expect(item).toMatchObject({ name: "rating", type: "registry:component" });
  expect(item.files[0].content).toContain('"mode": "show"');
  expect(item.files[0].content).toContain('"max": 10'); // clamped to the schema maximum
});
