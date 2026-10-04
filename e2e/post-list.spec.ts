import { expect, test } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["post-list"].variants);

for (const target of targets("post-list")) {
  test.describe(`post list — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("each post is an article: a title one level down that links, and a date in words", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("article")).toHaveCount(3);
      const first = page.getByRole("article").first();
      await expect(first.getByRole("heading", { level: 3 })).toHaveText("How we plan a week in one board");
      await expect(first.getByRole("link", { name: "How we plan a week in one board" })).toHaveAttribute("href", "/blog/plan-a-week");
      await expect(first.locator("time")).toHaveText("14 September 2026");
      await expect(first.locator("time")).toHaveAttribute("datetime", "2026-09-14");
    });

    test("list variant: titles at H4 under an H3, no summaries", async ({ page }) => {
      await open(page, target.url("list"));
      await expect(page.getByRole("heading", { level: 4 })).toHaveCount(3);
      await expect(page.getByText("The three columns we use")).toHaveCount(0);
    });
  });
}
