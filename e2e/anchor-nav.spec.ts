import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["anchor-nav"].variants);
const nav = (page: Page) => page.getByRole("navigation", { name: "On this page" });
const link = (page: Page, name: string) => nav(page).getByRole("link", { name });

for (const target of targets("anchor-nav")) {
  test.describe(`anchor navigation — ${target.name} export`, () => {
    test("no axe violations for every variant, and after following a link", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await link(page, "Options").click();
      await expectNoAxeViolations(page);
    });

    test("an ordered list of real links inside a named nav", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(nav(page)).toBeVisible();
      await expect(nav(page).getByRole("link")).toHaveCount(4);
      await expect(nav(page).locator("ol")).toBeVisible();
    });

    test("following one moves focus to the heading, not just the scroll position", async ({ page }) => {
      await open(page, target.url("default"));
      await link(page, "Accessibility notes").click();
      const heading = page.getByRole("heading", { name: "Accessibility notes" });
      await expect(heading).toBeFocused();
      await expect(heading).toHaveAttribute("tabindex", "-1");
    });

    test("the section being read is marked with aria-current=true, never page", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(link(page, "What it does")).toHaveAttribute("aria-current", "true");
      await link(page, "Accessibility notes").click();
      await expect(link(page, "Accessibility notes")).toHaveAttribute("aria-current", "true");
      await expect(link(page, "What it does")).not.toHaveAttribute("aria-current", "true");
      // "page" would claim the whole page had changed.
      await expect(nav(page).locator('[aria-current="page"]')).toHaveCount(0);
    });

    test("exactly one section is ever current", async ({ page }) => {
      await open(page, target.url("default"));
      await link(page, "Options").click();
      await expect(nav(page).locator('[aria-current="true"]')).toHaveCount(1);
    });

    test("the current mark is not colour alone", async ({ page }) => {
      await open(page, target.url("default"));
      const current = nav(page).locator('[aria-current="true"]');
      const weight = await current.evaluate((node) => getComputedStyle(node).fontWeight);
      expect(Number(weight)).toBeGreaterThanOrEqual(600);
      const border = await current.evaluate((node) => getComputedStyle(node).borderLeftWidth);
      expect(Number.parseFloat(border)).toBeGreaterThan(0);
    });

    test("plain variant: numbered, nothing marked, nothing sticky", async ({ page }) => {
      await open(page, target.url("plain"));
      await expect(nav(page).locator('[aria-current="true"]')).toHaveCount(0);
      await expect(nav(page).getByRole("link").first()).toContainText("1.");
    });
  });
}

test("registry serves the anchor navigation with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/anchor-nav.json?numbered=true&sticky=false")).json();
  expect(item).toMatchObject({ name: "anchor-nav", type: "registry:component" });
  expect(item.files[0].content).toContain('"numbered": true');
  expect(item.files[0].content).toContain('"sticky": false');
});
