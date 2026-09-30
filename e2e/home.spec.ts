import { expect, test } from "@playwright/test";
import { drawnSlugs } from "../components/part-drawing";
import { groups, inStock, parts } from "../lib/parts";
import { expectNoAxeViolations } from "./helpers";

/** Chromium only: the catalogue is plain layout, and hover is the same everywhere. */
test.skip(({ browserName, isMobile }) => browserName !== "chromium" || isMobile, "Chromium only");

test("pointing at a card plays its drawing, and focusing it does too; no frame opens", async ({ page }) => {
  await page.goto("/");
  const card = page.locator("#catalogue-list li").filter({ hasText: "Tabs" }).first();
  // The tab indicator slides one tab along while the card is pointed at.
  const indicator = card.locator(".dw-mv").first();
  const offset = () => indicator.evaluate((node) => getComputedStyle(node).translate);
  expect(await offset()).toBe("none");
  await card.hover();
  await expect.poll(offset).toBe("36px");
  await page.mouse.move(2, 2);
  await expect.poll(offset).toBe("none");
  await card.getByRole("link", { name: "Tabs" }).focus();
  await expect.poll(offset).toBe("36px");
  // The drawing is the preview now: nothing loads a live component into the catalogue.
  await expect(page.locator("#catalogue-list iframe")).toHaveCount(0);
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

test("every part has a group from its own type, other words to be found by, and a drawing", () => {
  const wrong = parts.filter((part) => !groups[part.category].includes(part.group)).map((part) => part.slug);
  expect(wrong).toEqual([]);
  expect(parts.filter((part) => part.aka.length === 0).map((part) => part.slug)).toEqual([]);
  expect(inStock.map((part) => part.slug).filter((slug) => !drawnSlugs.includes(slug))).toEqual([]);
});

test("a part is found by the word people use for it, and the card says why it is there", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("searchbox", { name: "Search the catalogue" });
  // None of these words is in the part's own name or description.
  for (const [word, name] of [
    ["calendar", "Date picker"],
    ["navbar", "Site header"],
    ["snackbar", "Toast notifications"],
  ]) {
    await search.fill(word);
    const card = page.locator("#catalogue-list li").filter({ hasText: name });
    await expect(card).toBeVisible();
    await expect(card.getByText(/^also called “/)).toBeVisible();
  }
  // A part found by its own words says nothing extra.
  await search.fill("date picker");
  await expect(page.locator("#catalogue-list li").first().getByText(/^also called/)).toHaveCount(0);
});

test("Ctrl K jumps to the search box from anywhere on the page", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("searchbox", { name: "Search the catalogue" });
  await expect(search).toBeVisible();
  await page.getByRole("link", { name: "Catalogue" }).first().focus();
  await page.keyboard.press("Control+k");
  await expect(search).toBeFocused();
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

test("the home page itself has no axe violations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("tab", { name: /Date picker/ })).toBeVisible();
  await expectNoAxeViolations(page);
});

test("the reel is a real tablist: arrows move it and the part changes with it", async ({ page }) => {
  await page.goto("/");
  const reel = page.getByRole("tablist", { name: "Parts you can try here" });
  await expect(reel.getByRole("tab", { name: /Date picker/ })).toHaveAttribute("aria-selected", "true");
  await reel.getByRole("tab", { name: /Date picker/ }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(reel.getByRole("tab", { name: /Searchable select/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toContainText("Country");
  await page.keyboard.press("End");
  await expect(reel.getByRole("tab", { name: /Rating/ })).toHaveAttribute("aria-selected", "true");
});

test("the reel holds still while it is being used", async ({ page }) => {
  await page.goto("/");
  const reel = page.getByRole("tablist", { name: "Parts you can try here" });
  await reel.getByRole("tab", { name: /Switch/ }).click();
  /*
   * And it stays held with the pointer nowhere near it: a phone cannot hover, and Safari does not
   * focus a button when it is tapped, so a hold that depends on either leaves a phone with a reel
   * that swaps the part out from under whoever is trying it.
   */
  await page.mouse.move(0, 0);
  await expect(page.getByText(/Held\./)).toBeVisible();
  // Nine seconds is the hold; it must not move on.
  await page.waitForTimeout(3000);
  await expect(reel.getByRole("tab", { name: /Switch/ })).toHaveAttribute("aria-selected", "true");
});
