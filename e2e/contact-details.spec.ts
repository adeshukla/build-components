import { expect, test } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["contact-details"].variants);

for (const target of targets("contact-details")) {
  test.describe(`contact details — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("each detail is labelled, and email and phone are links that write and call", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.locator("address dt")).toHaveText(["Email", "Phone", "Address", "Opening hours"]);
      await expect(page.getByRole("link", { name: "hello@example.com" })).toHaveAttribute("href", "mailto:hello@example.com");
      await expect(page.getByRole("link", { name: "+1 555 0100" })).toHaveAttribute("href", "tel:+15550100");
      await expect(page.locator("address")).toContainText("[TODO: street and number]");
    });

    test("an empty detail is left out, and the map link shows when set", async ({ page }) => {
      await open(page, target.url("short"));
      await expect(page.locator("address dt")).toHaveText(["Email"]);
      await expect(page.getByRole("link", { name: "Open in a map" })).toHaveAttribute("href", "https://www.openstreetmap.org/");
      await expect(page.getByRole("heading", { level: 3 })).toBeVisible();
    });
  });
}
