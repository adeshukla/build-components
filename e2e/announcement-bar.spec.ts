import { expect, test } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["announcement-bar"].variants);

for (const target of targets("announcement-bar")) {
  test.describe(`announcement bar — ${target.name} export`, () => {
    test("no axe violations for every variant, pale accent included", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("a landmark called Announcement, with its message and link", async ({ page }) => {
      await open(page, target.url("default"));
      const bar = page.getByRole("complementary", { name: "Announcement" });
      await expect(bar).toContainText("Shared boards are here");
      await expect(bar.getByRole("link", { name: "See what is new" })).toHaveAttribute("href", "/changelog");
    });

    test("on a pale accent the text turns black", async ({ page }) => {
      await open(page, target.url("pale"));
      await expect(page.getByRole("complementary", { name: "Announcement" }).locator("p")).toHaveCSS("color", "rgb(0, 0, 0)");
    });
  });
}
