import { expect, test } from "@playwright/test";

/*
 * The spotlight (D82): with a pointer, the light follows it and a card lights where it is; on a touch
 * screen, the cards crossing the middle of the screen light as the page scrolls.
 */
const followAt = (page: import("@playwright/test").Page) =>
  page.locator(".site-follow").evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);

test("with a pointer, the light follows it and the card under it lights up", async ({ page, isMobile }) => {
  test.skip(isMobile, "Pointer only");
  await page.goto("/");
  const card = page.locator("#catalogue-list li").first();
  await card.scrollIntoViewIfNeeded();
  const box = (await card.boundingBox())!;
  await page.mouse.move(box.x + 30, box.y + 30, { steps: 10 });
  await expect.poll(() => followAt(page)).toBeLessThan(box.x + 80);
  await expect(card).toHaveCSS("--cx", /px$/);
  await expect.poll(() => card.evaluate((el) => getComputedStyle(el, "::before").opacity)).toBe("1");
});

test("on a touch screen, scrolling lights the card in the middle of the screen", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Touch only");
  await page.goto("/");
  const list = page.locator("#catalogue-list");
  await list.scrollIntoViewIfNeeded();
  // Scrolls a little at a time until the page has hydrated and is listening.
  await expect
    .poll(async () => {
      await page.evaluate(() => window.scrollBy(0, 60));
      return page.locator(".spot.is-lit").count();
    })
    .toBeGreaterThan(0);
});

test("with reduced motion the light stays where it is", async ({ page, isMobile }) => {
  test.skip(isMobile, "Pointer only");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const before = await followAt(page);
  await page.mouse.move(20, 300, { steps: 10 });
  await page.waitForTimeout(400);
  expect(await followAt(page)).toBe(before);
});
