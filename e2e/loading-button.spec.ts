import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["loading-button"].variants);
const button = (page: Page) => page.getByRole("button");
const outcome = (page: Page) => page.locator("[data-outcome]");

for (const target of targets("loading-button")) {
  test.describe(`loading button — ${target.name} export`, () => {
    test("no axe violations for every variant, idle, busy and failed", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("slow"));
      await button(page).click();
      await expect(button(page)).toHaveAttribute("aria-busy", "true");
      await expectNoAxeViolations(page);
      await open(page, target.url("fails"));
      await button(page).click();
      await expect(outcome(page)).toHaveText(/Could not save/);
      await expectNoAxeViolations(page);
    });

    test("it is never the disabled attribute, so focus is not lost", async ({ page }) => {
      await open(page, target.url("slow"));
      await button(page).focus();
      await page.keyboard.press("Enter");
      await expect(button(page)).toHaveAttribute("aria-busy", "true");
      await expect(button(page)).toHaveAttribute("aria-disabled", "true");
      await expect(button(page)).not.toHaveAttribute("disabled", "");
      // The place is kept: a disabled button would have thrown focus to the page body.
      await expect(button(page)).toBeFocused();
    });

    test("the label says what is happening, not just a spinner", async ({ page }) => {
      await open(page, target.url("slow"));
      await expect(button(page)).toHaveText(/Save changes/);
      await button(page).click();
      await expect(button(page)).toHaveText(/Saving…/);
    });

    test("the button does not change width as the words change", async ({ page }) => {
      await open(page, target.url("slow"));
      const idle = (await button(page).boundingBox())?.width ?? 0;
      await button(page).click();
      await expect(button(page)).toHaveText(/Saving…/);
      const busy = (await button(page).boundingBox())?.width ?? 0;
      expect(Math.abs(busy - idle)).toBeLessThan(2);
    });

    test("a second press while it works sends nothing else", async ({ page }) => {
      await open(page, target.url("slow"));
      await button(page).click();
      await expect(button(page)).toHaveAttribute("aria-busy", "true");
      // Playwright will not click an aria-disabled control, so force it the way a determined person would.
      await button(page).click({ force: true });
      await expect(button(page)).toHaveAttribute("aria-busy", "true");
      await expect(outcome(page)).toHaveText("Changes saved.", { timeout: 8_000 });
    });

    test("the outcome is a polite status, and says what did not happen when it fails", async ({ page }) => {
      await open(page, target.url("fails"));
      await expect(outcome(page)).toHaveAttribute("role", "status");
      await button(page).click();
      await expect(outcome(page)).toHaveText("Could not save. Nothing was changed.");
      await expect(button(page)).toHaveText(/Try saving again/);
      await expect(button(page)).not.toHaveAttribute("aria-disabled", "true");
    });

    test("the spinner is hidden from screen readers", async ({ page }) => {
      await open(page, target.url("slow"));
      await button(page).click();
      const spinner = page.locator("[data-spinner]");
      await expect(spinner).toHaveAttribute("aria-hidden", "true");
    });

    test("spinnerless variant: the words still carry it", async ({ page }) => {
      await open(page, target.url("bare"));
      await expect(page.locator("[data-spinner]")).toHaveCount(0);
      await button(page).click();
      await expect(button(page)).toHaveText(/Saving…/);
    });
  });
}

test("registry serves the loading button with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/loading-button.json?idleLabel=Publish&showSpinner=false")).json();
  expect(item).toMatchObject({ name: "loading-button", type: "registry:component" });
  expect(item.files[0].content).toContain('"idleLabel": "Publish"');
  expect(item.files[0].content).toContain('"showSpinner": false');
});
