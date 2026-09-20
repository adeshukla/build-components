import { expect, test } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.breadcrumbs.variants);

for (const target of targets("breadcrumbs")) {
  test.describe(`breadcrumbs — ${target.name} export`, () => {
    test.use({ viewport: { width: 1280, height: 900 } });

    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("the trail is named, and every step but the last is a link", async ({ page }) => {
      await open(page, target.url("default"));
      const nav = page.getByRole("navigation", { name: "Breadcrumb" });
      await expect(nav).toBeVisible();
      await expect(nav.getByRole("link")).toHaveCount(3);
      await expect(nav.getByRole("link", { name: "Catalogue" })).toHaveAttribute("href", "/catalogue");
    });

    test("the current page is marked, and is not a link", async ({ page }) => {
      await open(page, target.url("default"));
      const current = page.getByText("Breadcrumbs", { exact: true });
      await expect(current).toHaveAttribute("aria-current", "page");
      await expect(page.getByRole("link", { name: "Breadcrumbs" })).toHaveCount(0);
    });

    test("plain variant: a different separator, no home icon", async ({ page }) => {
      await open(page, target.url("plain"));
      await expect(page.getByRole("navigation", { name: "You are here" })).toBeVisible();
      // Scoped to the trail: the dev tools put their own icons in the page.
      await expect(page.getByRole("navigation", { name: "You are here" }).locator("svg")).toHaveCount(0);
    });
  });
}

for (const target of targets("breadcrumbs")) {
  test.describe(`breadcrumbs on a phone — ${target.name} export`, () => {
    test.use({ viewport: { width: 375, height: 780 } });

    test("the middle steps give way, and the trail still fits on one line", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("link", { name: /Home/ })).toBeVisible();
      await expect(page.getByText("Breadcrumbs", { exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: "Catalogue" })).toBeHidden();
      await expect(page.getByRole("link", { name: "Navigation" })).toBeHidden();
    });

    test("with collapsing off every step stays", async ({ page }) => {
      await open(page, target.url("plain"));
      await expect(page.getByRole("link", { name: "Catalogue" })).toBeVisible();
    });
  });
}

test("registry serves the breadcrumbs with config from the URL", async ({ request }) => {
  const query = new URLSearchParams({
    items: JSON.stringify([{ label: "Evil", href: "javascript:alert(1)" }]),
    separator: "squiggle",
  });
  const item = await (await request.get(`/r/breadcrumbs.json?${query}`)).json();
  expect(item).toMatchObject({ name: "breadcrumbs", type: "registry:component" });
  expect(item.files[0].content).not.toContain("javascript:");
  expect(item.files[0].content).toContain('"separator": "chevron"'); // unknown value falls back
});
