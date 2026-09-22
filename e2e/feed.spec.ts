import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.feed.variants);
const feed = (page: Page) => page.getByRole("feed", { name: "Latest updates" });
const items = (page: Page) => feed(page).getByRole("article");
const more = (page: Page) => page.getByRole("button", { name: "Load more" });

for (const target of targets("feed")) {
  test.describe(`feed — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("articles carry their position in the whole feed", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(items(page)).toHaveCount(4);
      await expect(items(page).first()).toHaveAttribute("aria-posinset", "1");
      await expect(items(page).first()).toHaveAttribute("aria-setsize", "10");
      await expect(items(page).first()).toHaveAccessibleName("Search now finds partial words");
      await expect(page.getByText("Showing 4 of 10")).toBeVisible();
    });

    test("Load more adds the next page, moves focus to it and says so", async ({ page }) => {
      await open(page, target.url("default"));
      await more(page).click();
      await expect(items(page)).toHaveCount(8);
      await expect(items(page).nth(4)).toBeFocused();
      await expect(page.getByRole("status")).toHaveText("4 more loaded. Showing 8 of 10.");
      await expect(feed(page)).toHaveAttribute("aria-busy", "false");
    });

    test("the end is said in words", async ({ page }) => {
      await open(page, target.url("default"));
      await more(page).click();
      await expect(items(page)).toHaveCount(8);
      await more(page).click();
      await expect(items(page)).toHaveCount(10);
      await expect(more(page)).toHaveCount(0);
      await expect(page.getByText("That's everything: 10 of 10.")).toBeVisible();
    });

    test("Page Down and Page Up move between articles", async ({ page }) => {
      await open(page, target.url("default"));
      await items(page).first().focus();
      await page.keyboard.press("PageDown");
      await expect(items(page).nth(1)).toBeFocused();
      await page.keyboard.press("PageDown");
      await page.keyboard.press("PageUp");
      await expect(items(page).nth(1)).toBeFocused();
    });

    test("scroll variant: reaching the end loads more without moving focus", async ({ page }) => {
      await open(page, target.url("scroll"));
      await more(page).focus();
      // Scrolled into view rather than with a mouse wheel, which touch devices don't have.
      await page.locator("[data-sentinel]").scrollIntoViewIfNeeded();
      await expect(items(page)).not.toHaveCount(3);
      await expect(more(page).or(page.getByText(/That's everything/))).toBeVisible();
      await expect(items(page).nth(3)).not.toBeFocused();
    });
  });
}

test("registry serves the feed with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/feed.json?mode=scroll&pageSize=99")).json();
  expect(item).toMatchObject({ name: "feed", type: "registry:component" });
  expect(item.files[0].content).toContain('"mode": "scroll"');
  expect(item.files[0].content).toContain('"pageSize": 20'); // clamped to the schema maximum
});
