import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["session-timeout"].variants);
const trigger = (page: Page) => page.getByRole("button", { name: "Show the warning now" });
const dialog = (page: Page) => page.getByRole("dialog");

for (const target of targets("session-timeout")) {
  test.describe(`session timeout — ${target.name} export`, () => {
    test("no axe violations for every variant, closed and while warning", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await trigger(page).click();
      await expect(dialog(page)).toBeVisible();
      await expectNoAxeViolations(page);
    });

    test("the warning takes focus to the stay button and counts down", async ({ page }) => {
      await open(page, target.url("default"));
      await trigger(page).click();
      await expect(page.getByRole("button", { name: "Stay signed in" })).toBeFocused();
      // The clock is aria-hidden, so it is read from the page rather than through a role. A second
      // may already have gone by, so what matters is that it starts near the top and goes down.
      const face = page.locator("dialog p").last();
      await expect(face).toHaveText(/^0:(30|29|28)$/);
      const seconds = async () => Number((await face.textContent())?.split(":")[1]);
      const started = await seconds();
      await expect.poll(seconds, { timeout: 5000 }).toBeLessThan(started ?? 30);
    });

    test("staying signed in closes it and says so", async ({ page }) => {
      await open(page, target.url("default"));
      await trigger(page).click();
      await page.getByRole("button", { name: "Stay signed in" }).click();
      await expect(dialog(page)).toBeHidden();
      await expect(page.getByRole("status")).toHaveText("Still signed in");
      await expect(trigger(page)).toBeFocused();
    });

    test("Escape means stay, never sign out", async ({ page }) => {
      await open(page, target.url("default"));
      await trigger(page).click();
      await page.keyboard.press("Escape");
      await expect(dialog(page)).toBeHidden();
      await expect(page.getByRole("status")).toHaveText("Still signed in");
    });

    test("signing out now says that instead", async ({ page }) => {
      await open(page, target.url("default"));
      await trigger(page).click();
      await page.getByRole("button", { name: "Sign out now" }).click();
      await expect(page.getByRole("status")).toHaveText("Signed out");
    });

    test("quick variant: it warns on its own after the quiet stretch, and speaks at the marks", async ({ page }) => {
      await open(page, target.url("quick"));
      await expect(trigger(page)).toHaveCount(0);
      await expect(dialog(page)).toBeVisible({ timeout: 12000 });
      await expect(page.getByRole("status")).toHaveText("5 seconds left", { timeout: 10000 });
      await page.getByRole("button", { name: "Stay signed in" }).click();
      await expect(dialog(page)).toBeHidden();
    });
  });
}

test("registry serves the session timeout with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/session-timeout.json?idleSeconds=120&watchActivity=false")).json();
  expect(item).toMatchObject({ name: "session-timeout", type: "registry:component" });
  expect(item.files[0].content).toContain('"idleSeconds": 120');
  expect(item.files[0].content).toContain('"watchActivity": false');
});
