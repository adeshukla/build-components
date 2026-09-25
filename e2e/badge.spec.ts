import { expect, test } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.badge.variants);

for (const target of targets("badge")) {
  test.describe(`badges — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("each state is in words, and they read as a list", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("listitem")).toHaveCount(5);
      for (const text of ["Live", "In review", "Needs changes", "Failed", "Draft"]) {
        await expect(page.getByText(text, { exact: true })).toBeVisible();
      }
    });

    test("nothing in a badge can be focused", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.locator("ul").locator("a[href], button, input, select, textarea, [tabindex]")).toHaveCount(0);
    });

    test("solid variant: no dots", async ({ page }) => {
      await open(page, target.url("solid"));
      await expect(page.getByRole("list").locator("[aria-hidden=true]")).toHaveCount(0);
      await expect(page.getByText("Live", { exact: true })).toBeVisible();
    });
  });
}

test("registry serves the badges with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/badge.json?variant=outline&size=xl")).json();
  expect(item).toMatchObject({ name: "badge", type: "registry:component" });
  expect(item.files[0].content).toContain('"variant": "outline"');
  expect(item.files[0].content).toContain('"size": "md"'); // unknown value falls back
});
