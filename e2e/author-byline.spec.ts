import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["author-byline"].variants);
const byline = (page: Page) => page.locator("[data-byline]");

for (const target of targets("author-byline")) {
  test.describe(`author byline — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("it is not an address landmark", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.locator("address")).toHaveCount(0);
    });

    test("the author link says it is the author", async ({ page }) => {
      await open(page, target.url("default"));
      const link = byline(page).getByRole("link", { name: "Adesh Shukla" });
      await expect(link).toHaveAttribute("rel", "author");
      await expect(link).toHaveAttribute("href", "https://devstash.me");
    });

    test("both dates are said, as real time elements", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(byline(page).locator("time")).toHaveCount(2);
      await expect(byline(page)).toContainText("Published 12 September 2026");
      await expect(byline(page)).toContainText("Updated 24 September 2026");
      await expect(byline(page).locator("time").first()).toHaveAttribute("datetime", "2026-09-12");
    });

    test("the initials circle is decoration", async ({ page }) => {
      await open(page, target.url("default"));
      const avatar = byline(page).locator('[aria-hidden="true"]').first();
      await expect(avatar).toHaveText("AS");
      const box = await avatar.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    });

    test("the role is part of the same sentence as the name", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(byline(page)).toContainText("By Adesh Shukla, UI developer");
    });

    test("bare variant: no link, no avatar, no updated date", async ({ page }) => {
      await open(page, target.url("bare"));
      await expect(byline(page).getByRole("link")).toHaveCount(0);
      await expect(byline(page).locator("time")).toHaveCount(1);
      await expect(byline(page)).not.toContainText("Updated");
    });
  });
}

test("registry serves the author byline with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/author-byline.json?showAvatar=false&layout=stacked")).json();
  expect(item).toMatchObject({ name: "author-byline", type: "registry:component" });
  expect(item.files[0].content).toContain('"showAvatar": false');
  expect(item.files[0].content).toContain('"layout": "stacked"');
});
