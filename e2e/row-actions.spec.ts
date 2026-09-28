import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["row-actions"].variants);
const rows = (page: Page) => page.locator("tbody tr");

for (const target of targets("row-actions")) {
  test.describe(`row actions — ${target.name} export`, () => {
    test("no axe violations for every variant, and after an action", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await page.getByRole("button", { name: "Delete Churn by cohort" }).click();
      await expectNoAxeViolations(page);
    });

    test("it is a captioned table with a named actions column", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("table", { name: "Saved reports" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Actions" })).toBeVisible();
      await expect(rows(page)).toHaveCount(3);
    });

    test("each row's name is its row header", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("rowheader", { name: "Quarterly revenue" })).toBeVisible();
      await expect(page.getByRole("rowheader")).toHaveCount(3);
    });

    test("every action is named with the row it acts on", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("button", { name: "Run Quarterly revenue" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Delete Support backlog" })).toBeVisible();
      // Nine buttons, nine distinct names.
      const names = await page.getByRole("button").evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("aria-label") ?? node.textContent?.trim() ?? ""),
      );
      expect(names).toHaveLength(9);
      expect(new Set(names).size).toBe(9);
    });

    test("what was done names both the action and the row", async ({ page }) => {
      await open(page, target.url("default"));
      await page.getByRole("button", { name: "Duplicate Support backlog" }).click();
      await expect(page.getByRole("status")).toHaveText("Duplicate — Support backlog");
    });

    test("the destructive action is still named in words, not only coloured", async ({ page }) => {
      await open(page, target.url("default"));
      const danger = page.getByRole("button", { name: "Delete Quarterly revenue" });
      await expect(danger).toHaveText("Delete");
      const box = await danger.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    });

    test("two-action variant: its own labels and caption", async ({ page }) => {
      await open(page, target.url("two"));
      await expect(page.getByRole("table", { name: "Team invites" })).toBeVisible();
      await expect(page.getByRole("button", { name: /^Resend / })).toHaveCount(3);
    });
  });
}

test("registry serves the row actions with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/row-actions.json?caption=Team+invites")).json();
  expect(item).toMatchObject({ name: "row-actions", type: "registry:component" });
  expect(item.files[0].content).toContain('"caption": "Team invites"');
});
