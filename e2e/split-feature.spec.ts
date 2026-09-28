import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["split-feature"].variants);
const media = (page: Page) => page.locator("[data-media]");

for (const target of targets("split-feature")) {
  test.describe(`split feature — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("one named section, one heading, and the points as a list", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("region", { name: /Test the file/ })).toBeVisible();
      await expect(page.getByRole("heading", { level: 2 })).toHaveCount(1);
      await expect(page.getByRole("listitem")).toHaveCount(3);
    });

    test("the words come first in the source whichever side the picture is on", async ({ page }) => {
      for (const variant of ["default", "flipped"]) {
        await open(page, target.url(variant));
        const wordsFirst = await page.evaluate(() => {
          const heading = document.querySelector("h2, h3");
          const picture = document.querySelector("[data-media]");
          if (heading === null || picture === null) return false;
          return (heading.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
        });
        expect(wordsFirst).toBe(true);
      }
    });

    test("the ticks are decoration", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("listitem").first().locator('svg[aria-hidden="true"]')).toBeVisible();
    });

    test("the picture's shape is reserved before anything loads", async ({ page }) => {
      await open(page, target.url("default"));
      const ratio = await media(page).evaluate((node) => getComputedStyle(node).aspectRatio);
      expect(ratio.replace(/\s/g, "")).toBe("4/3");
    });

    test("an undescribed panel is decoration; a described one is an image", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("img")).toHaveCount(0);
      await expect(page.getByText("[TODO: set mediaSrc]")).toBeVisible();
      await open(page, target.url("described"));
      await expect(page.getByRole("img", { name: /test bench/ })).toBeVisible();
    });

    test("flipped variant: the picture moves, the source order does not", async ({ page }) => {
      await open(page, target.url("flipped"));
      await expect(media(page)).toBeVisible();
      await expect(page.getByRole("heading", { level: 3 })).toBeVisible();
    });
  });
}

test("registry serves the split feature with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/split-feature.json?mediaSide=left&headingLevel=h3")).json();
  expect(item).toMatchObject({ name: "split-feature", type: "registry:component" });
  expect(item.files[0].content).toContain('"mediaSide": "left"');
  expect(item.files[0].content).toContain('"headingLevel": "h3"');
});
