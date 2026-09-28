import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["stat-comparison"].variants);
const rows = (page: Page) => page.locator("tbody tr");

for (const target of targets("stat-comparison")) {
  test.describe(`stat comparison — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("it is a captioned table with both options as column headers", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("table", { name: /side by side/ })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "React + Tailwind" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "HTML, CSS and JS" })).toBeVisible();
      await expect(rows(page)).toHaveCount(5);
    });

    test("the corner header is never empty in the markup", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("columnheader", { name: "Measure" })).toBeAttached();
      await expect(page.getByRole("columnheader")).toHaveCount(3);
    });

    test("each measure is its row's header", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("rowheader", { name: "Files to copy" })).toBeVisible();
      await expect(page.getByRole("rowheader")).toHaveCount(5);
    });

    test("which one is better is said in words, not only shaded", async ({ page }) => {
      await open(page, target.url("default"));
      const winners = page.locator('[data-better="true"]');
      await expect(winners).toHaveCount(3);
      await expect(winners.first()).toContainText("Better here");
    });

    test("a row with no winner marks neither side", async ({ page }) => {
      await open(page, target.url("default"));
      const draw = rows(page).nth(1);
      await expect(draw).toContainText("Runtime dependencies");
      await expect(draw.locator('[data-better="true"]')).toHaveCount(0);
    });

    test("the note says on what terms, rather than just declaring a winner", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByText("Better depends on the project", { exact: false })).toBeVisible();
    });

    test("nothing is focusable: it is facts, not controls", async ({ page }) => {
      await open(page, target.url("default"));
      // Scoped to the component: the harness page around it is not what this claim is about.
      await expect(page.locator("table").locator("a, button, input, [tabindex]")).toHaveCount(0);
    });

    test("plain variant: nothing marked better, and its own corner header", async ({ page }) => {
      await open(page, target.url("plain"));
      await expect(page.locator('[data-better="true"]')).toHaveCount(0);
      await expect(page.getByRole("columnheader", { name: "What differs" })).toBeVisible();
    });
  });
}

test("registry serves the stat comparison with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/stat-comparison.json?showBetter=false&metricHeader=What+differs")).json();
  expect(item).toMatchObject({ name: "stat-comparison", type: "registry:component" });
  expect(item.files[0].content).toContain('"showBetter": false');
  expect(item.files[0].content).toContain('"metricHeader": "What differs"');
});
