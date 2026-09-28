import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["article-card"].variants);
const card = (page: Page) => page.locator("[data-card]");

for (const target of targets("article-card")) {
  test.describe(`article card — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("one link per card, and it is the title", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(card(page).getByRole("link")).toHaveCount(1);
      await expect(card(page).getByRole("link")).toHaveAccessibleName("Why your focus ring keeps disappearing");
      // No second link to the same place called something useless.
      await expect(page.getByRole("link", { name: /read more/i })).toHaveCount(0);
    });

    test("the title is a heading at the level you asked for", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
      await open(page, target.url("grid"));
      await expect(page.getByRole("heading", { level: 3 })).toBeVisible();
    });

    test("the whole card is clickable through that one link", async ({ page }) => {
      await open(page, target.url("default"));
      const overlay = await card(page)
        .getByRole("link")
        .evaluate((node) => getComputedStyle(node, "::after").position);
      expect(overlay).toBe("absolute");
    });

    test("the plain variant has no overlay, so text can be selected", async ({ page }) => {
      await open(page, target.url("grid"));
      const overlay = await card(page)
        .getByRole("link")
        .evaluate((node) => getComputedStyle(node, "::after").content);
      expect(overlay === "none" || overlay === "normal").toBe(true);
    });

    test("the date is a real time element written out in full", async ({ page }) => {
      await open(page, target.url("default"));
      const when = card(page).locator("time");
      await expect(when).toHaveAttribute("datetime", "2026-09-12");
      await expect(when).toHaveText("12 September 2026");
      await expect(card(page)).toContainText("7 minute read");
    });

    test("the thumbnail is decoration unless it is described", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("img")).toHaveCount(0);
      await open(page, target.url("described"));
      await expect(page.getByRole("img", { name: /focus ring/ })).toBeVisible();
    });

    test("the tags are a list, not links", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(card(page).getByRole("listitem")).toHaveCount(2);
      await expect(card(page).getByRole("listitem").first()).toHaveText("Accessibility");
    });
  });
}

test("registry serves the article card with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/article-card.json?headingLevel=h3&wholeCardClickable=false")).json();
  expect(item).toMatchObject({ name: "article-card", type: "registry:component" });
  expect(item.files[0].content).toContain('"headingLevel": "h3"');
  expect(item.files[0].content).toContain('"wholeCardClickable": false');
});
