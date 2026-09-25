import { expect, test } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["alert-banner"].variants);

for (const target of targets("alert-banner")) {
  test.describe(`alert banner — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("a warning waits its turn and says its tone first", async ({ page }) => {
      await open(page, target.url("default"));
      const banner = page.getByRole("status").filter({ hasText: "Your card expires next month" });
      await expect(banner).toBeVisible();
      await expect(banner.getByText("Warning: Your card expires next month")).toBeVisible();
      await expect(banner.getByRole("link", { name: "Update card" })).toHaveAttribute("href", "/billing");
    });

    test("an error interrupts, and can't be dismissed", async ({ page }) => {
      await open(page, target.url("error"));
      // Next adds its own role=alert announcer to every page: pick this one by its words.
      const banner = page.getByRole("alert").filter({ hasText: "We couldn't save your changes" });
      await expect(banner).toBeVisible();
      await expect(banner.getByText("Error: We couldn't save your changes")).toBeVisible();
      await expect(page.getByRole("button", { name: /^Dismiss/ })).toHaveCount(0);
    });

    test("dismissing removes it without stranding focus", async ({ page }) => {
      await open(page, target.url("default"));
      await page.getByRole("button", { name: /^Dismiss/ }).click();
      await expect(page.getByText("Your card expires next month")).toHaveCount(0);
      await expect(page.locator("body")).toBeFocused();
    });
  });
}

test("registry serves the alert banner with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/alert-banner.json?tone=success&actionUrl=javascript:alert(1)")).json();
  expect(item).toMatchObject({ name: "alert-banner", type: "registry:component" });
  expect(item.files[0].content).toContain('"tone": "success"');
  expect(item.files[0].content).toContain('"actionUrl": "#"'); // unsafe link refused
});
