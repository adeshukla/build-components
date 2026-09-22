import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["cookie-consent"].variants);
const banner = (page: Page) => page.getByRole("region", { name: "Cookies on this site" });
const preferences = (page: Page) => page.getByRole("dialog", { name: "Cookie preferences" });
const stored = (page: Page) =>
  page.evaluate(() => JSON.parse(window.localStorage.getItem("cookie-consent") ?? "null")?.categories ?? null);

for (const target of targets("cookie-consent")) {
  test.describe(`cookie consent — ${target.name} export`, () => {
    test("no axe violations for every variant, banner and preferences", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expect(banner(page)).toBeVisible();
        await expectNoAxeViolations(page);
        await page.getByRole("button", { name: "Choose cookies" }).click();
        await expect(preferences(page)).toBeVisible();
        await expectNoAxeViolations(page);
      }
    });

    test("the banner does not take focus, and accept and reject are equals", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(banner(page)).toBeVisible();
      await expect(page.locator("body")).toBeFocused();
      const accept = page.getByRole("button", { name: "Accept all" });
      const reject = page.getByRole("button", { name: "Reject all" });
      const look = (button: typeof accept) =>
        button.evaluate((element) => {
          const style = getComputedStyle(element);
          return [style.backgroundColor, style.color, style.fontWeight, style.minHeight].join();
        });
      expect(await look(accept)).toBe(await look(reject));
    });

    test("Reject all saves every category off and hands focus to Cookie settings", async ({ page }) => {
      await open(page, target.url("default"));
      await page.getByRole("button", { name: "Reject all" }).click();
      await expect(banner(page)).toBeHidden();
      await expect(page.getByRole("button", { name: "Cookie settings" })).toBeFocused();
      expect(await stored(page)).toEqual({ analytics: false, marketing: false });

      await open(page, target.url("default")); // waits for hydration, unlike a bare reload
      await expect(page.getByRole("button", { name: "Cookie settings" })).toBeVisible();
      await expect(banner(page)).toBeHidden();
    });

    test("preferences: nothing ticked in advance, saved per category, editable later", async ({ page }) => {
      await open(page, target.url("default"));
      await page.getByRole("button", { name: "Choose cookies" }).click();
      await expect(page.getByRole("heading", { name: "Cookie preferences" })).toBeFocused();
      await expect(page.getByRole("checkbox", { name: "Necessary" })).toBeDisabled();
      const analytics = page.getByRole("checkbox", { name: "Analytics" });
      await expect(analytics).not.toBeChecked();
      await expect(page.getByRole("checkbox", { name: "Marketing" })).not.toBeChecked();
      await expect(analytics).toHaveAccessibleDescription(/Counts visits/);
      await analytics.check();
      await page.getByRole("button", { name: "Save choices" }).click();
      await expect(preferences(page)).toBeHidden();
      await expect(banner(page)).toBeHidden();
      // Not lost to the page: the button that opened the dialog has just gone.
      await expect(page.getByRole("button", { name: "Cookie settings" })).toBeFocused();
      expect(await stored(page)).toEqual({ analytics: true, marketing: false });

      await page.getByRole("button", { name: "Cookie settings" }).click();
      await expect(page.getByRole("checkbox", { name: "Analytics" })).toBeChecked();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Cookie settings" })).toBeFocused();
    });

    test("Accept all turns every category on", async ({ page }) => {
      await open(page, target.url("default"));
      await page.getByRole("button", { name: "Accept all" }).click();
      expect(await stored(page)).toEqual({ analytics: true, marketing: true });
    });
  });
}

test("registry serves the cookie consent with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/cookie-consent.json?policyUrl=javascript:alert(1)&position=corner")).json();
  expect(item).toMatchObject({ name: "cookie-consent", type: "registry:component" });
  expect(item.files[0].content).toContain('"policyUrl": "#"'); // unsafe link refused
  expect(item.files[0].content).toContain('"position": "corner"');
});
