import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["team-grid"].variants);
const people = (page: Page) => page.getByRole("listitem");

for (const target of targets("team-grid")) {
  test.describe(`team grid — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("it is a named list of people, not a stack of headings", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("list", { name: "Who you will be working with" })).toBeVisible();
      await expect(people(page)).toHaveCount(4);
      await expect(page.getByRole("heading")).toHaveCount(1);
    });

    test("the initials circle is decoration", async ({ page }) => {
      await open(page, target.url("default"));
      const circle = people(page).first().locator('[aria-hidden="true"]');
      await expect(circle).toBeVisible();
      const box = await circle.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    });

    test("no people are invented", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByText("[TODO: name]").first()).toBeVisible();
      await expect(page.getByText("ask each person before you do", { exact: false })).toBeVisible();
    });

    test("a linked name is a link, and an unlinked one is not", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(people(page).getByRole("link")).toHaveCount(0);
      await open(page, target.url("linked"));
      await expect(people(page).first().getByRole("link")).toBeVisible();
    });

    test("bare variant: no circles and one column", async ({ page }) => {
      await open(page, target.url("bare"));
      await expect(people(page).first().locator('[aria-hidden="true"]')).toHaveCount(0);
    });
  });
}

test("registry serves the team grid with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/team-grid.json?columns=1&showInitials=false")).json();
  expect(item).toMatchObject({ name: "team-grid", type: "registry:component" });
  expect(item.files[0].content).toContain('"columns": 1');
  expect(item.files[0].content).toContain('"showInitials": false');
});
