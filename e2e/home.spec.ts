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
  const card = page.locator("#catalogue-list li").filter({ hasText: "Almanac" }).first();
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
  const card = page.locator("#catalogue-list li").filter({ hasText: "Porthole" }).first();
  await card.getByRole("link", { name: "Porthole" }).focus();
  await expect(card.locator("[inert]")).toBeVisible();
  // Inert: the frame inside can never swallow the Tab key.
  await page.keyboard.press("Tab");
  await expect(page.locator("#catalogue-list li [inert]")).toHaveCount(0);
});
