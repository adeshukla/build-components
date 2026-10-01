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
  await expect(page.getByRole("group", { name: "Choose a part to watch" })).toBeVisible();
  await expectNoAxeViolations(page);
});

test("the hero plays a real part, can be paused, and its chapters change the part", async ({ page }) => {
  await page.goto("/");
  const video = page.locator("figure video");
  // The clip is put in once the page has loaded (D76).
  await expect(video).toHaveAttribute("src", "/reels/command-menu.webm", { timeout: 15_000 });
  await expect.poll(() => video.evaluate((node: HTMLVideoElement) => !node.paused)).toBe(true);

  // Anything that moves on its own for more than five seconds can be paused (WCAG 2.2.2).
  await page.getByRole("button", { name: "Pause the clips" }).click();
  await expect(page.getByRole("button", { name: "Play the clips" })).toBeVisible();
  await expect(page.locator("figure img")).toHaveAttribute("src", "/reels/command-menu.jpg");

  await page.getByRole("group", { name: "Choose a part to watch" }).getByRole("button", { name: /^Date picker/ }).click();
  await expect(page.getByRole("link", { name: "Open the date picker" })).toHaveAttribute("href", "/date-picker");
  await expect(page.locator("figure img")).toHaveAttribute("alt", /^Date picker, used with the keyboard only/);
});

test("with reduced motion the hero shows stills and plays nothing until asked", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("figure img")).toHaveAttribute("src", "/reels/command-menu.jpg");
  await expect(page.locator("figure video")).toHaveCount(0);
  await page.getByRole("button", { name: "Play the clips" }).click();
  await expect(page.locator("figure video")).toHaveCount(1);
});
