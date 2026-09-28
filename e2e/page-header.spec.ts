import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["page-header"].variants);
const header = (page: Page) => page.locator("[data-page-header]");

for (const target of targets("page-header")) {
  test.describe(`page header — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("it is a header holding the page's one h1", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(header(page)).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Accessibility statement");
    });

    test("the trail is its own named nav", async ({ page }) => {
      await open(page, target.url("default"));
      const trail = page.getByRole("navigation", { name: "Breadcrumb" });
      await expect(trail).toBeVisible();
      await expect(trail.getByRole("link")).toHaveCount(2);
    });

    test("the current page is the last step and is not a link", async ({ page }) => {
      await open(page, target.url("default"));
      const current = page.locator('[aria-current="page"]');
      await expect(current).toHaveText("Accessibility statement");
      await expect(current.getByRole("link")).toHaveCount(0);
    });

    test("the separators are hidden from screen readers", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("navigation", { name: "Breadcrumb" }).locator('[aria-hidden="true"]')).toHaveCount(2);
    });

    test("the detail is a labelled pair, not a bare value", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(header(page).locator("dt")).toHaveText("Last reviewed");
      await expect(header(page).locator("dd")).toHaveText("24 September 2026");
    });

    test("there is no eyebrow above the title", async ({ page }) => {
      await open(page, target.url("default"));
      // Only the trail comes before the h1, and it is a nav.
      const before = await page.evaluate(() => {
        const title = document.querySelector("h1");
        const previous = title?.previousElementSibling;
        return previous === null || previous === undefined ? "none" : previous.tagName.toLowerCase();
      });
      expect(["none", "nav"]).toContain(before);
    });

    test("both actions are comfortable targets", async ({ page }) => {
      await open(page, target.url("default"));
      for (const name of ["Report a problem", "How it is tested"]) {
        const box = await page.getByRole("link", { name }).boundingBox();
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      }
    });

    test("bare variant: no trail, no actions, no detail", async ({ page }) => {
      await open(page, target.url("bare"));
      await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toHaveCount(0);
      await expect(header(page).getByRole("link")).toHaveCount(0);
      await expect(header(page).locator("dl")).toHaveCount(0);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  });
}

test("registry serves the page header with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/page-header.json?align=centre&metaLabel=Updated")).json();
  expect(item).toMatchObject({ name: "page-header", type: "registry:component" });
  expect(item.files[0].content).toContain('"align": "centre"');
  expect(item.files[0].content).toContain('"metaLabel": "Updated"');
});
