import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.search.variants);
const box = (page: Page) => page.getByRole("combobox");
const result = (page: Page, name: string | RegExp) => page.getByRole("option", { name });

/** Opens the dialog in the default variant; the inline one is already open. */
async function start(page: Page, url: string) {
  await open(page, url);
  const trigger = page.getByRole("button", { name: /Search the site/ });
  if (await trigger.count()) await trigger.click();
}

for (const target of targets("search")) {
  test.describe(`search — ${target.name} export`, () => {
    test("no axe violations, closed, open and with results", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await start(page, target.url("default"));
      await box(page).fill("guide");
      await expectNoAxeViolations(page);
    });

    test("the button opens a dialog with the box already focused", async ({ page }) => {
      await start(page, target.url("default"));
      await expect(page.getByRole("dialog", { name: "Search the site" })).toBeVisible();
      await expect(box(page)).toBeFocused();
    });

    test("⌘K or Ctrl+K opens it from anywhere, and Escape gives focus back", async ({ page }) => {
      await open(page, target.url("default"));
      await page.keyboard.press("Control+k");
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toBeHidden();
      await expect(page.getByRole("button", { name: /Search the site/ })).toBeFocused();
    });

    test("nested data is found, with its trail", async ({ page }) => {
      await start(page, target.url("default"));
      await box(page).fill("keyboard");
      // Two levels down: Guides › Accessibility › Keyboard support.
      const keyboard = result(page, /Keyboard support/);
      await expect(keyboard).toBeVisible();
      // The group heading carries "Guides"; the trail carries the rest.
      await expect(keyboard).toContainText("Accessibility · Every key");
      await expect(page.getByRole("group", { name: "Guides" })).toBeVisible();
    });

    test("tags are searched, not only titles", async ({ page }) => {
      await start(page, target.url("default"));
      await box(page).fill("voiceover");
      await expect(result(page, /Screen readers/)).toBeVisible();
    });

    test("every word has to match", async ({ page }) => {
      await start(page, target.url("default"));
      await box(page).fill("accessibility audit");
      await expect(result(page, /Sam Okafor/)).toBeVisible();
      await expect(result(page, /Keyboard support/)).toHaveCount(0);
      await expect(page.getByText("1 results.")).toBeAttached();
    });

    test("the arrows point at a result while the caret stays in the box", async ({ page }) => {
      await start(page, target.url("default"));
      await box(page).fill("a");
      await expect(box(page)).toHaveAttribute("aria-activedescendant", "search-result-0");
      await page.keyboard.press("ArrowDown");
      await expect(box(page)).toHaveAttribute("aria-activedescendant", "search-result-1");
      await expect(box(page)).toBeFocused();
    });

    test("nothing matching is said, not just left blank", async ({ page }) => {
      await start(page, target.url("default"));
      await box(page).fill("zzzz");
      await expect(page.getByText("Nothing matches that. Try a shorter word.").first()).toBeVisible();
    });

    test("inline variant: different data, searched in place, without groups", async ({ page }) => {
      await open(page, target.url("inline"));
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await box(page).fill("oat");
      await expect(result(page, /Oat milk flat white/)).toBeVisible();
      // No groups here, so the whole trail stays with the result.
      await expect(result(page, /Oat milk flat white/)).toContainText("Coffee · Double shot");
      await expect(page.getByRole("group")).toHaveCount(0);
    });
  });
}

test("registry serves the search with config from the URL, and neutralises bad links", async ({ request }) => {
  const query = new URLSearchParams({
    data: JSON.stringify([{ title: "Evil", url: "javascript:alert(1)" }]),
    layout: "floating",
    maxResults: "999",
  });
  const item = await (await request.get(`/r/search.json?${query}`)).json();
  expect(item).toMatchObject({ name: "search", type: "registry:component" });
  expect(item.files[0].content).toContain('"layout": "dialog"'); // unknown value falls back
  expect(item.files[0].content).toContain('"maxResults": 50'); // clamped to the schema maximum
  // The data is carried as written; every link is checked again when it is followed.
  expect(item.files[0].content).toContain("function safeHref");
});
