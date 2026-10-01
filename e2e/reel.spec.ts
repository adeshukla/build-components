import { expect, test, type Page } from "@playwright/test";

/*
 * The home page reel (D79): real parts played live in a frame. Chromium and WebKit, because keeping focus
 * on the page is browser behaviour, and that is the thing most likely to break.
 */
test.skip(({ isMobile }) => isMobile, "Desktop engines");
test.describe.configure({ timeout: 90_000 });
// Tall enough that the page's search and the reel are on screen together: off screen, the reel pauses.
test.use({ viewport: { width: 1280, height: 2400 } });

const chapter = (page: Page) => page.getByRole("group", { name: "Choose a part to watch" }).locator('[aria-pressed="true"]');
const scale = (page: Page) =>
  page.locator('iframe[src="/reel"]').evaluate((frame: HTMLIFrameElement) => new DOMMatrix(frame.style.transform).a);

test("the reel plays real parts without ever taking focus from the page", async ({ page }) => {
  await page.goto("/");
  const search = page.locator("main input").first();
  await search.click();
  await page.keyboard.type("ab");
  const wide = await scale(page);
  // The camera moves in; the reel types, opens a listbox, and moves on to the date picker's dialog.
  await expect.poll(() => scale(page), { timeout: 15_000 }).toBeGreaterThan(wide);
  await expect(chapter(page)).toHaveText("Date picker", { timeout: 30_000 });
  await expect(page.frameLocator('iframe[src="/reel"]').locator("dialog[open]")).toBeVisible({ timeout: 15_000 });
  await page.keyboard.type("cd");
  await expect(search).toHaveValue("abcd");
  await expect(search).toBeFocused();
});

test("the reel pauses, and its chapters change the part", async ({ page }) => {
  await page.goto("/");
  await expect(chapter(page)).toHaveText("Searchable select");
  await page.getByRole("group", { name: "Choose a part to watch" }).getByRole("button", { name: "Kanban board" }).click();
  await expect(page.getByRole("link", { name: "Open the kanban board" })).toHaveAttribute("href", "/kanban");
  await expect(page.frameLocator('iframe[src="/reel"]').locator('[aria-label="Refit board"]')).toBeVisible();

  // Anything that moves on its own for more than five seconds can be paused (WCAG 2.2.2). Every scene
  // lasts longer than this wait, so a paused reel is still on the same one.
  await page.getByRole("button", { name: "Pause the reel" }).click();
  await expect(page.getByRole("button", { name: "Play the reel" })).toBeVisible();
  await page.waitForTimeout(12_000);
  await expect(chapter(page)).toHaveText("Kanban board");
});

test("with reduced motion the hero shows stills and plays nothing until asked", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("figure img")).toHaveAttribute("src", "/reels/searchable-select.jpg");
  await page.getByRole("group", { name: "Choose a part to watch" }).getByRole("button", { name: "OTP input" }).click();
  await expect(page.locator("figure img")).toHaveAttribute("src", "/reels/otp.jpg");
  await expect(page.locator('iframe[src="/reel"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Play the reel" }).click();
  await expect(page.locator('iframe[src="/reel"]')).toHaveCount(1);
});
