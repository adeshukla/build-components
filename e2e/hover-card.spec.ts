import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["hover-card"].variants);
const trigger = (page: Page) => page.locator("[data-trigger]");
const card = (page: Page) => page.locator("[data-card]");

for (const target of targets("hover-card")) {
  test.describe(`hover card — ${target.name} export`, () => {
    test("no axe violations for every variant, closed and open", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("instant"));
      await trigger(page).focus();
      await expect(card(page)).toBeVisible();
      await expectNoAxeViolations(page);
    });

    test("the trigger is a real link to the same place", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(trigger(page)).toHaveAttribute("href", /searchable-select/);
      await expect(card(page)).toBeHidden();
    });

    test("it opens on focus, not only on hover", async ({ page }) => {
      await open(page, target.url("instant"));
      await trigger(page).focus();
      await expect(card(page)).toBeVisible();
      await expect(card(page)).toContainText("Searchable select");
    });

    test("Escape dismisses it without moving the pointer", async ({ page }) => {
      await open(page, target.url("instant"));
      await trigger(page).focus();
      await expect(card(page)).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(card(page)).toBeHidden();
    });

    test("the pointer can travel onto the card without it vanishing", async ({ page }) => {
      await open(page, target.url("instant"));
      await trigger(page).hover();
      await expect(card(page)).toBeVisible();
      await card(page).hover();
      await expect(card(page)).toBeVisible();
    });

    test("it describes the link only while it is open", async ({ page }) => {
      await open(page, target.url("instant"));
      await expect(trigger(page)).not.toHaveAttribute("aria-describedby", /.+/);
      await trigger(page).focus();
      await expect(trigger(page)).toHaveAccessibleDescription(/Searchable select/);
    });

    test("nothing inside the card is interactive", async ({ page }) => {
      await open(page, target.url("instant"));
      await trigger(page).focus();
      await expect(card(page)).toHaveAttribute("role", "tooltip");
      await expect(card(page).locator("a, button, input, select, textarea")).toHaveCount(0);
    });

    test("above variant: the card sits over the line rather than under it", async ({ page }) => {
      await open(page, target.url("above"));
      await trigger(page).focus();
      await expect(card(page)).toBeVisible();
      const cardBox = await card(page).boundingBox();
      const linkBox = await trigger(page).boundingBox();
      expect(cardBox?.y ?? 0).toBeLessThan(linkBox?.y ?? 0);
    });
  });
}

test("registry serves the hover card with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/hover-card.json?placement=above&openDelayMs=0")).json();
  expect(item).toMatchObject({ name: "hover-card", type: "registry:component" });
  expect(item.files[0].content).toContain('"placement": "above"');
  expect(item.files[0].content).toContain('"openDelayMs": 0');
});
