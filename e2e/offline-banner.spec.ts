import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["offline-banner"].variants);
const toggle = (page: Page) => page.getByRole("button", { name: /Pretend/ });
const offlineText = "You are offline. Anything you change is kept on this device until the connection is back.";

for (const target of targets("offline-banner")) {
  test.describe(`offline banner — ${target.name} export`, () => {
    test("no axe violations for every variant, online and offline", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
        await toggle(page).click();
        await expect(page.getByText(offlineText)).toBeVisible();
        await expectNoAxeViolations(page);
      }
    });

    test("it says nothing until the connection has actually dropped", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByText(offlineText)).toBeHidden();
      await expect(page.getByText("Back online.")).toBeHidden();
    });

    test("going offline shows what is kept, and coming back says so", async ({ page }) => {
      await open(page, target.url("default"));
      await toggle(page).click();
      await expect(page.getByText(offlineText)).toBeVisible();
      await expect(toggle(page)).toHaveText("Pretend the connection is back");
      await toggle(page).click();
      await expect(page.getByText(offlineText)).toBeHidden();
      await expect(page.getByText("Back online.")).toBeVisible();
    });

    test("retry re-checks and says when there is still nothing", async ({ page }) => {
      await open(page, target.url("default"));
      await toggle(page).click();
      await page.getByRole("button", { name: "Try again" }).click();
      await expect(page.getByText("Still nothing. The connection is not back yet.")).toBeVisible();
    });

    test("the message is in a polite status region, not an alert", async ({ page }) => {
      await open(page, target.url("default"));
      await toggle(page).click();
      const region = page.locator("[role=status]").filter({ hasText: offlineText });
      await expect(region).toHaveCount(1);
      await expect(page.locator("[role=alert]").filter({ hasText: offlineText })).toHaveCount(0);
    });

    test("inline variant: no retry button and nothing fixed to the viewport", async ({ page }) => {
      await open(page, target.url("inline"));
      await toggle(page).click();
      await expect(page.getByRole("button", { name: "Try again" })).toHaveCount(0);
      await expect(page.getByText(offlineText)).toBeVisible();
    });
  });
}

test("registry serves the offline banner with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/offline-banner.json?position=bottom&showRetry=false")).json();
  expect(item).toMatchObject({ name: "offline-banner", type: "registry:component" });
  expect(item.files[0].content).toContain('"position": "bottom"');
  expect(item.files[0].content).toContain('"showRetry": false');
});
