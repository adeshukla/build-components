import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["pull-quote"].variants);
const quote = (page: Page) => page.locator("blockquote");
const caption = (page: Page) => page.locator("figcaption");

for (const target of targets("pull-quote")) {
  test.describe(`pull quote — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("it is a figure holding a blockquote and a caption", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.locator("figure")).toBeVisible();
      await expect(quote(page)).toBeVisible();
      await expect(caption(page)).toBeVisible();
    });

    test("the attribution is in the caption, not inside the quotation", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(quote(page)).toContainText("Almost nothing else about it matters");
      await expect(quote(page)).not.toContainText("Léonie Watson");
      await expect(caption(page)).toContainText("Léonie Watson");
    });

    test("cite wraps the work, not the person", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.locator("cite")).toHaveText("Accessibility, from the ground up");
      await expect(page.locator("cite")).not.toContainText("Léonie");
    });

    test("the quotation marks are decoration", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(quote(page).locator('[aria-hidden="true"]')).toHaveCount(2);
    });

    test("a linked source becomes the blockquote's cite attribute too", async ({ page }) => {
      await open(page, target.url("sourced"));
      await expect(quote(page)).toHaveAttribute("cite", /devstash/);
      await expect(caption(page).getByRole("link")).toBeVisible();
    });

    test("bare variant: no marks, centred, and nothing to focus", async ({ page }) => {
      await open(page, target.url("bare"));
      await expect(quote(page).locator('[aria-hidden="true"]')).toHaveCount(0);
      // Scoped to the component: the harness page around it is not what this claim is about.
      await expect(page.locator("figure").locator("a, button, [tabindex]")).toHaveCount(0);
    });
  });
}

test("registry serves the pull quote with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/pull-quote.json?showMarks=false&align=centre")).json();
  expect(item).toMatchObject({ name: "pull-quote", type: "registry:component" });
  expect(item.files[0].content).toContain('"showMarks": false');
  expect(item.files[0].content).toContain('"align": "centre"');
});
