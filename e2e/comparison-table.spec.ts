import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["comparison-table"].variants);
const row = (page: Page, name: string) => page.getByRole("row").filter({ has: page.getByRole("rowheader", { name }) });

for (const target of targets("comparison-table")) {
  test.describe(`comparison table — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("features are row headers and plans column headers", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("columnheader")).toHaveCount(4);
      await expect(page.getByRole("columnheader", { name: /Crew/ })).toBeVisible();
      await expect(page.getByRole("rowheader", { name: "Single sign-on" })).toBeVisible();
      await expect(page.getByRole("table")).toContainText("What each plan includes");
    });

    test("yes and no are words, not bare ticks", async ({ page }) => {
      await open(page, target.url("default"));
      const sso = row(page, "Single sign-on");
      await expect(sso.getByRole("cell").nth(0)).toContainText("No");
      await expect(sso.getByRole("cell").nth(2)).toContainText("Yes");
      // The tick and cross are decoration: hidden from the tree, with the word next to them.
      const marks = page.locator("td [aria-hidden=true]");
      expect(await marks.count()).toBeGreaterThan(0);
      for (const mark of await marks.all()) {
        expect(["✓", "✕"]).toContain((await mark.textContent())?.trim());
      }
    });

    test("values that are not yes or no are printed as they are", async ({ page }) => {
      await open(page, target.url("default"));
      const storage = row(page, "File storage");
      await expect(storage.getByRole("cell").nth(1)).toHaveText("100 GB");
    });

    test("the highlighted column says so in words", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("columnheader", { name: /Crew/ })).toContainText("Most picked");
    });

    test("two variant: nothing highlighted", async ({ page }) => {
      await open(page, target.url("two"));
      await expect(page.getByText("Most picked")).toHaveCount(0);
      await expect(page.getByRole("table")).toContainText("Compare the two plans");
    });
  });
}

test("registry serves the comparison table with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/comparison-table.json?highlight=Fleet&yesText=Included")).json();
  expect(item).toMatchObject({ name: "comparison-table", type: "registry:component" });
  expect(item.files[0].content).toContain('"highlight": "Fleet"');
  expect(item.files[0].content).toContain('"yesText": "Included"');
});
