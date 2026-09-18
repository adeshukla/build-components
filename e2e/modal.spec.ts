import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.modal.variants);

const trigger = (page: Page) => page.getByRole("button", { name: "Open dialog" });
const dialog = (page: Page) => page.getByRole("dialog", { name: "Subscribe to updates" });
const button = (page: Page, name: string) => page.getByRole("button", { name, exact: true });

for (const target of targets("modal")) {
  test.describe(`modal — ${target.name} export`, () => {
    test("no axe violations, closed and open, for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
        await trigger(page).click();
        await expect(dialog(page)).toBeVisible();
        await expectNoAxeViolations(page);
      }
    });

    test("keyboard only: focus starts on the title, Tab wraps, Escape closes and focus returns", async ({ page }) => {
      await open(page, target.url("default"));
      await trigger(page).focus();
      await page.keyboard.press("Enter");
      await expect(dialog(page)).toBeVisible();
      await expect(dialog(page)).toHaveAccessibleDescription(
        "Get an email when new components are released. Unsubscribe any time.",
      );
      await expect(page.getByRole("heading", { name: "Subscribe to updates" })).toBeFocused();
      await expect(page.locator("html")).toHaveCSS("overflow", "hidden");

      await page.keyboard.press("Shift+Tab"); // from the title → last button
      await expect(button(page, "Confirm")).toBeFocused();
      await page.keyboard.press("Tab"); // wraps → first button
      await expect(button(page, "Close")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(button(page, "Cancel")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(button(page, "Confirm")).toBeFocused();

      await page.keyboard.press("Escape");
      await expect(dialog(page)).toBeHidden();
      await expect(trigger(page)).toBeFocused();
      await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
    });

    test("Cancel, × and backdrop click all close it", async ({ page }) => {
      await open(page, target.url("default"));
      const closers: [string, () => Promise<void>][] = [
        ["Cancel button", () => button(page, "Cancel").click()],
        ["× button", () => button(page, "Close").click()],
        ["backdrop click", () => page.mouse.click(5, 5)],
      ];
      for (const [name, close] of closers) {
        await test.step(name, async () => {
          await trigger(page).click();
          await expect(dialog(page)).toBeVisible();
          await close();
          await expect(dialog(page)).toBeHidden();
          await expect(trigger(page)).toBeFocused();
        });
      }
    });

    test("sheet variant: primary gets focus, optional buttons off, backdrop click ignored", async ({ page }) => {
      await open(page, target.url("sheet"));
      await trigger(page).click();
      await expect(button(page, "Confirm")).toBeFocused();
      await expect(button(page, "Close")).toHaveCount(0);
      await expect(button(page, "Cancel")).toHaveCount(0);

      await page.keyboard.press("Tab"); // only one button: focus stays on it
      await expect(button(page, "Confirm")).toBeFocused();
      await page.mouse.click(5, 5);
      await expect(dialog(page)).toBeVisible();
      await expect(button(page, "Confirm")).toBeFocused(); // backdrop click doesn't steal focus

      await page.keyboard.press("Enter");
      await expect(dialog(page)).toBeHidden();
      await expect(trigger(page)).toBeFocused();
    });

    test("position: centred by default, flush with the bottom edge as a sheet", async ({ page, isMobile }) => {
      // On iPhone the modal is deliberately always a sheet, so centring does not apply there.
      test.skip(!!isMobile, "iPhone look presents every modal as a bottom sheet");
      const viewport = page.viewportSize()!;

      await open(page, target.url("default"));
      await trigger(page).click();
      const centred = (await dialog(page).boundingBox())!;
      expect(Math.abs(centred.x + centred.width / 2 - viewport.width / 2)).toBeLessThan(2);
      expect(Math.abs(centred.y + centred.height / 2 - viewport.height / 2)).toBeLessThan(2);

      await open(page, target.url("sheet"));
      await trigger(page).click();
      const sheet = (await dialog(page).boundingBox())!;
      expect(Math.round(sheet.y + sheet.height)).toBe(viewport.height);
      expect(Math.abs(sheet.x + sheet.width / 2 - viewport.width / 2)).toBeLessThan(2);
    });
  });
}

test("registry serves the modal with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/modal.json?position=bottom&size=huge")).json();
  expect(item).toMatchObject({ name: "modal", type: "registry:component" });
  expect(item.files[0].content).toContain('"position": "bottom"');
  expect(item.files[0].content).toContain('"size": "md"'); // invalid value falls back to the default
  expect((await request.get("/r/..%2Fdate-picker.json")).status()).toBe(404);
});
