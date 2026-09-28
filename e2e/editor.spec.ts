import { expect, test } from "@playwright/test";
import { inStock } from "../lib/parts";

/**
 * The editor runs the HTML/CSS/JS output in a sandboxed frame, which blocks things a plain page
 * allows (forms, storage). The component tests load the files directly, so they would never see
 * that; these tests run every part the way a visitor does. Chromium only: the sandbox is the
 * same everywhere, and the component tests already cover the browsers.
 */
test.skip(({ browserName, isMobile }) => browserName !== "chromium" || isMobile, "Chromium only");

for (const part of inStock) {
  test(`${part.name}: both outputs load in the editor without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto(`/${part.slug}`);
    const react = page.frameLocator(`iframe[src^="/preview/${part.slug}"]`);
    // The frame loads the preview route and hydrates it, which can take a moment on a cold route.
    await expect(react.locator("body > *").first()).toBeAttached({ timeout: 15000 });

    await page.locator('input[value="vanilla"]').check({ force: true });
    const vanilla = page.frameLocator("iframe[srcdoc]");
    // Anything at all: some parts (a badge, a skeleton) have no interactive element to look for.
    await expect(vanilla.locator("body > *").first()).toBeAttached({ timeout: 15000 });
    // The frame grows to fit its content, like the React one, instead of cutting it off.
    const frame = await page.locator("iframe[srcdoc]").boundingBox();
    const content = await vanilla.locator("body").evaluate((body) =>
      Math.max(...[...body.children].map((child) => child.getBoundingClientRect().bottom)),
    );
    expect(frame!.height + 1).toBeGreaterThanOrEqual(Math.min(content, 760));

    expect(errors).toEqual([]);
  });
}

test("cookie preferences save inside the sandboxed HTML/CSS/JS frame", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/cookie-consent");
  await page.locator('input[value="vanilla"]').check({ force: true });
  // The banner is fixed to the bottom of the frame, and a fixed element can't be scrolled to.
  await page.locator("iframe[srcdoc]").scrollIntoViewIfNeeded();
  const frame = page.frameLocator("iframe[srcdoc]");
  await frame.getByRole("button", { name: "Choose cookies" }).click();
  await frame.getByRole("checkbox", { name: "Analytics" }).check();
  await frame.getByRole("button", { name: "Save choices" }).click();
  await expect(frame.getByRole("dialog", { name: "Cookie preferences" })).toBeHidden();
  await expect(frame.getByRole("region", { name: "Cookies on this site" })).toBeHidden();
  await expect(frame.getByRole("button", { name: "Cookie settings" })).toBeFocused();
  expect(errors).toEqual([]);
});

test("copy all three gives one page that runs on its own", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/date-picker");
  await page.locator('input[value="vanilla"]').check({ force: true });
  await page.getByRole("button", { name: /^Copy all three/ }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());

  // Nothing left pointing at a file that is not there, and everything written in instead.
  expect(copied).not.toContain('<link rel="stylesheet"');
  expect(copied).not.toContain("<script src=");
  expect(copied).toContain(".dp-");
  expect(copied).toContain("function");

  // And it is a page: put it in a browser as it is, and the component works.
  const loose = await context.newPage();
  await loose.setContent(copied);
  await loose.getByRole("button", { name: "Choose date" }).click();
  await expect(loose.getByRole("dialog")).toBeVisible();
});
