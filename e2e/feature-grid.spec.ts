import { expect, test } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["feature-grid"].variants);

for (const target of targets("feature-grid")) {
  test.describe(`feature grid — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("the features are a list of headings", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("listitem")).toHaveCount(6);
      await expect(page.getByRole("heading", { level: 3 })).toHaveCount(6);
      await expect(page.getByRole("heading", { name: "No dependency" })).toBeVisible();
    });

    test("the glyphs are hidden from the accessibility tree", async ({ page }) => {
      await open(page, target.url("default"));
      const glyphs = page.locator("li [aria-hidden=true]");
      await expect(glyphs).toHaveCount(6);
      await expect(glyphs.first()).toHaveText("❏");
    });

    test("a feature link names its feature", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("link", { name: "Read more about accessible first" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Read more", exact: true })).toHaveCount(0);
    });

    test("four variant: renamed heading, no rules", async ({ page }) => {
      await open(page, target.url("four"));
      await expect(page.getByRole("region", { name: "Why this yard" })).toBeVisible();
      await expect(page.getByRole("listitem")).toHaveCount(6);
    });
  });
}

test("registry serves the feature grid with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/feature-grid.json?columns=two&showRule=false")).json();
  expect(item).toMatchObject({ name: "feature-grid", type: "registry:component" });
  expect(item.files[0].content).toContain('"columns": "two"');
  expect(item.files[0].content).toContain('"showRule": false');
});
