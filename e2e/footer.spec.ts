import { expect, test } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.footer.variants);

for (const target of targets("footer")) {
  test.describe(`footer — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("default: brand, named link group and the legal line", async ({ page }) => {
      await open(page, target.url("default"));
      // The harness puts the footer inside <main>, so it is an element here, not a landmark.
      const footer = page.locator("footer").first();
      await expect(footer.getByText("Northwind", { exact: true })).toBeVisible();
      await expect(footer.getByText("Design and build for teams that ship.")).toBeVisible();

      const nav = page.getByRole("navigation", { name: "Footer" });
      await expect(nav.getByRole("link")).toHaveCount(4);
      await expect(nav.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/contact");
      await expect(footer.getByText("© Northwind Ltd. All rights reserved.")).toBeVisible();

      // No social row and no back-to-top link until they are switched on.
      await expect(page.getByRole("link", { name: "GitHub" })).toHaveCount(0);
      await expect(page.getByRole("link", { name: "Back to top" })).toHaveCount(0);

      // Links take focus. (Safari only Tabs to links when the user turns that on, so
      // focusing directly is the portable check.)
      const contact = nav.getByRole("link", { name: "Contact" });
      await contact.focus();
      await expect(contact).toBeFocused();
    });

    test("full variant: social profiles, back to top, and the dark surface", async ({ page }) => {
      await open(page, target.url("full"));
      await expect(page.getByRole("navigation", { name: "More from Harbour" })).toBeVisible();
      await expect(page.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com");
      await expect(page.getByRole("link", { name: "LinkedIn" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Back to top" })).toHaveAttribute("href", "#top");
      await expect(page.locator("footer").first()).toHaveCSS("background-color", "rgb(20, 16, 25)");
    });
  });
}

test("a link from a shared URL can never run script", async ({ request }) => {
  const query = new URLSearchParams({
    links: JSON.stringify([{ label: "Evil", href: "javascript:alert(1)" }]),
    spacing: "enormous",
  });
  const item = await (await request.get(`/r/footer.json?${query}`)).json();
  expect(item).toMatchObject({ name: "footer", type: "registry:component" });
  expect(item.files[0].content).not.toContain("javascript:");
  expect(item.files[0].content).toContain('"href": "#"');
  expect(item.files[0].content).toContain('"spacing": "regular"'); // unknown value falls back
});
