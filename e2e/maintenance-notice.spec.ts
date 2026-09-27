import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["maintenance-notice"].variants);
const notice = (page: Page) => page.locator("[data-notice]");
const dismiss = (page: Page) => page.getByRole("button", { name: /Dismiss this notice/ });

for (const target of targets("maintenance-notice")) {
  test.describe(`maintenance notice — ${target.name} export`, () => {
    test("no axe violations for every variant, shown and dismissed", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("forgetful"));
      await dismiss(page).click();
      await expectNoAxeViolations(page);
    });

    test("it is a named region, not a live region", async ({ page }) => {
      await open(page, target.url("forgetful"));
      await expect(page.getByRole("region", { name: "Planned maintenance" })).toBeVisible();
      await expect(notice(page)).not.toHaveAttribute("role", "status");
      await expect(notice(page)).not.toHaveAttribute("aria-live", /.*/);
    });

    test("the window is a real time element written out in full", async ({ page }) => {
      await open(page, target.url("forgetful"));
      const when = notice(page).locator("time");
      await expect(when).toHaveAttribute("datetime", "2026-10-04T22:00");
      await expect(when).toHaveText("4 October at 22:00 until 5 October at 02:00");
    });

    test("it says what will and will not work", async ({ page }) => {
      await open(page, target.url("forgetful"));
      await expect(notice(page)).toContainText("Saving will be turned off");
      await expect(notice(page)).toContainText("stays safe");
    });

    test("it is sticky rather than fixed, so it keeps its own space", async ({ page }) => {
      await open(page, target.url("forgetful"));
      const position = await notice(page).evaluate((node) => getComputedStyle(node).position);
      expect(position).toBe("sticky");
    });

    test("the dismiss button is named in words and is a 44px target", async ({ page }) => {
      await open(page, target.url("forgetful"));
      const box = await dismiss(page).boundingBox();
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    });

    test("dismissing takes it away and says so, leaving the page behind", async ({ page }) => {
      await open(page, target.url("forgetful"));
      await dismiss(page).click();
      await expect(notice(page)).toBeHidden();
      await expect(page.getByRole("status")).toHaveText("Notice dismissed.");
    });

    // Only on the served page: a file:// page has no usable localStorage, so the plain output falls
    // back to memory there and a reload legitimately forgets. The fallback itself is what the axe and
    // dismiss tests above prove works.
    if (target.name === "React + Tailwind") {
      test("with remembering on, it stays away after a reload", async ({ page }) => {
        await open(page, target.url("default"));
        await dismiss(page).click();
        await expect(notice(page)).toBeHidden();
        await open(page, target.url("default"));
        await expect(notice(page)).toBeHidden();
      });
    }

    test("permanent variant: no dismiss button at all", async ({ page }) => {
      await open(page, target.url("permanent"));
      await expect(dismiss(page)).toHaveCount(0);
      await expect(notice(page)).toBeVisible();
    });
  });
}

test("registry serves the maintenance notice with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/maintenance-notice.json?tone=warning&dismissible=false")).json();
  expect(item).toMatchObject({ name: "maintenance-notice", type: "registry:component" });
  expect(item.files[0].content).toContain('"tone": "warning"');
  expect(item.files[0].content).toContain('"dismissible": false');
});
