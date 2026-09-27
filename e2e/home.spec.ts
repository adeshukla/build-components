import { expect, test } from "@playwright/test";
import { demos } from "../lib/demos";
import { inStock } from "../lib/parts";

/** Chromium only: the catalogue is plain layout, and hover is the same everywhere. */
test.skip(({ browserName, isMobile }) => browserName !== "chromium" || isMobile, "Chromium only");

test("every part in stock says how it works", () => {
  const missing = inStock.filter((part) => !demos[part.slug]?.how).map((part) => part.slug);
  expect(missing).toEqual([]);
});

test("hovering a card previews the real component and explains it", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  const card = page.locator("#catalogue-list li").filter({ hasText: "Date picker" }).first();
  await card.hover();

  const panel = card.locator("[inert]");
  await expect(panel).toBeVisible();
  await expect(panel.getByText(demos["date-picker"].how)).toBeVisible();
  // The real exported component, not a picture: the preview page for this part.
  const preview = panel.locator("iframe");
  await expect(preview).toHaveAttribute("src", "/preview/date-picker?demo=1");
  await expect(panel.frameLocator("iframe").getByRole("textbox", { name: /Date/ })).toBeVisible();

  await page.mouse.move(2, 2);
  await expect(panel).toBeHidden();
  expect(errors).toEqual([]);
});

test("the preview opens on keyboard focus as well as hover", async ({ page }) => {
  await page.goto("/");
  const card = page.locator("#catalogue-list li").filter({ hasText: "Modal dialog" }).first();
  await card.getByRole("link", { name: "Modal dialog" }).focus();
  await expect(card.locator("[inert]")).toBeVisible();
  // Inert: the frame inside can never swallow the Tab key.
  await page.keyboard.press("Tab");
  await expect(page.locator("#catalogue-list li [inert]")).toHaveCount(0);
});

test("searching the catalogue narrows it, and says how many are left", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("searchbox", { name: "Search the catalogue" });
  await search.fill("dialog");
  await expect(page.getByRole("status")).toHaveText(/parts? matching “dialog”/);
  const names = await page.locator("#catalogue-list li h3").allTextContents();
  expect(names).toContain("Modal dialog");
  // The date picker is in there too, and should be: its pattern is a date picker dialog.
  expect(names).not.toContain("Badge");

  // It matches what a part does and its URL too, not only its name.
  await search.fill("color");
  await expect(page.locator("#catalogue-list li h3")).toHaveText(["Colour picker"]);
});

test("a search with no hits offers a way out instead of an empty page", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("searchbox", { name: "Search the catalogue" });
  await search.fill("kombucha");
  await expect(page.getByRole("status")).toHaveText("Nothing matches. Try a shorter word, or clear the search.");
  await page.getByRole("button", { name: "Clear the search" }).click();
  await expect(search).toHaveValue("");
  await expect(search).toBeFocused();
  await expect(page.locator("#catalogue-list li").first()).toBeVisible();
});

test("slash jumps to the search box, but not while typing in it", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("searchbox", { name: "Search the catalogue" });
  // The shortcut is wired up on hydration, so wait for the box before pressing anything.
  await expect(search).toBeVisible();
  await page.keyboard.press("/");
  await expect(search).toBeFocused();
  await page.keyboard.type("table");
  await expect(search).toHaveValue("table");
});
