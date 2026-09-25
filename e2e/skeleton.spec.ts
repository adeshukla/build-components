import { expect, test } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.skeleton.variants);

for (const target of targets("skeleton")) {
  test.describe(`skeleton — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("says what is loading, once, and hides the shapes", async ({ page }) => {
      await open(page, target.url("default"));
      const status = page.getByRole("status");
      await expect(status).toHaveText("Loading comments…");
      // The shapes are decoration: nothing inside them is exposed.
      await expect(status.locator("[aria-hidden=true]")).toHaveCount(1);
    });

    test("nothing in it can be focused", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.locator("[role=status]").locator("a[href], button, input, select, textarea, [tabindex]")).toHaveCount(0);
    });

    test("cards variant: rows, no avatar, no animation", async ({ page }) => {
      await open(page, target.url("cards"));
      await expect(page.getByRole("status")).toBeVisible();
      const animated = await page
        .locator("[aria-hidden=true] span, [aria-hidden=true] div")
        .evaluateAll((nodes) => nodes.filter((node) => getComputedStyle(node).animationName !== "none").length);
      expect(animated).toBe(0);
    });
  });
}

test("registry serves the skeleton with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/skeleton.json?variant=card&rows=99")).json();
  expect(item).toMatchObject({ name: "skeleton", type: "registry:component" });
  expect(item.files[0].content).toContain('"variant": "card"');
  expect(item.files[0].content).toContain('"rows": 8'); // clamped to the schema maximum
});
