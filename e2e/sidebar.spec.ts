import { expect, test } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.sidebar.variants);

for (const target of targets("sidebar")) {
  test.describe(`sidebar — ${target.name} export`, () => {
    test.use({ viewport: { width: 1280, height: 900 } });

    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("sections are headings, and the current page is marked", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("navigation", { name: "Workspace" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Library" })).toBeVisible();
      await expect(page.getByRole("link", { name: /^Orders/ })).toHaveAttribute("aria-current", "page");
      await expect(page.getByRole("link", { name: /^Customers/ })).not.toHaveAttribute("aria-current", "page");
    });

    test("a count is read with a word, not as a bare number", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("link", { name: "Orders 12 waiting" })).toBeVisible();
    });

    test("a section folds away and says so", async ({ page }) => {
      await open(page, target.url("default"));
      const settings = page.getByRole("button", { name: "Settings" });
      await expect(settings).toHaveAttribute("aria-expanded", "true");
      await expect(page.getByRole("link", { name: "Billing" })).toBeVisible();

      await settings.click();
      await expect(settings).toHaveAttribute("aria-expanded", "false");
      await expect(page.getByRole("link", { name: "Billing" })).toBeHidden();
    });

    test("plain variant: fixed sections, no counts", async ({ page }) => {
      await open(page, target.url("plain"));
      await expect(page.getByRole("button", { name: "Settings" })).toHaveCount(0);
      await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Orders 12 waiting" })).toHaveCount(0);
    });
  });
}

for (const target of targets("sidebar")) {
  test.describe(`sidebar on a phone — ${target.name} export`, () => {
    test.use({ viewport: { width: 375, height: 780 } });

    test("no axe violations, closed and open", async ({ page }) => {
      await open(page, target.url("default"));
      await expectNoAxeViolations(page);
      await page.getByRole("button", { name: "Menu" }).click();
      await expectNoAxeViolations(page);
    });

    test("the links hide behind a button, and Escape closes the drawer", async ({ page }) => {
      await open(page, target.url("default"));
      const toggle = page.getByRole("button", { name: "Menu" });
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(page.getByRole("link", { name: /^Orders/ })).toBeHidden();

      await toggle.click();
      await expect(page.getByRole("link", { name: /^Orders/ })).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(toggle).toBeFocused();
    });
  });
}

test("registry serves the sidebar with config from the URL", async ({ request }) => {
  const query = new URLSearchParams({
    items: JSON.stringify([{ section: "Evil", label: "Click", href: "javascript:alert(1)", badge: "" }]),
    width: "9999",
  });
  const item = await (await request.get(`/r/sidebar.json?${query}`)).json();
  expect(item).toMatchObject({ name: "sidebar", type: "registry:component" });
  expect(item.files[0].content).not.toContain("javascript:");
  expect(item.files[0].content).toContain('"width": 400'); // clamped to the schema maximum
});
