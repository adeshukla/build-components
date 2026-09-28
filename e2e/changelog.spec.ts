import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.changelog.variants);
const releases = (page: Page) => page.locator("ol > li");

for (const target of targets("changelog")) {
  test.describe(`changelog — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("releases are an ordered list, one per version", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(releases(page)).toHaveCount(3);
      await expect(page.getByRole("heading", { name: "2.4.0" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "2.3.1" })).toBeVisible();
    });

    test("each release heading is one level below the section's", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("heading", { level: 2, name: "What changed" })).toBeVisible();
      await expect(page.getByRole("heading", { level: 3, name: "2.4.0" })).toBeVisible();
    });

    test("the kind is a word, not a colour", async ({ page }) => {
      await open(page, target.url("default"));
      const first = releases(page).first();
      await expect(first.getByText("Added", { exact: true })).toBeVisible();
      await expect(first.getByText("Fixed", { exact: true })).toBeVisible();
      // Two Added lines, one heading for them.
      await expect(first.getByText("Added", { exact: true })).toHaveCount(1);
      await expect(first.locator("ul").first().locator("li")).toHaveCount(2);
    });

    test("dates are real time elements, written out in full", async ({ page }) => {
      await open(page, target.url("default"));
      const when = releases(page).first().locator("time");
      await expect(when).toHaveAttribute("datetime", "2026-09-18");
      await expect(when).toHaveText("18 September 2026");
    });

    test("the newest release is marked in words", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(releases(page).first().getByText("Latest")).toBeVisible();
      await expect(releases(page).nth(1).getByText("Latest")).toHaveCount(0);
    });

    test("nothing is hidden behind a disclosure", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.locator("details")).toHaveCount(0);
      await expect(page.getByText("The legacy CSV importer", { exact: false })).toBeVisible();
    });

    test("plain variant: no latest badge and its own heading level", async ({ page }) => {
      await open(page, target.url("plain"));
      await expect(page.getByText("Latest")).toHaveCount(0);
      await expect(page.getByRole("heading", { level: 3, name: "Release notes" })).toBeVisible();
      await expect(page.getByRole("heading", { level: 4, name: "2.4.0" })).toBeVisible();
    });
  });
}

test("registry serves the changelog with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/changelog.json?showLatest=false&heading=Release+notes")).json();
  expect(item).toMatchObject({ name: "changelog", type: "registry:component" });
  expect(item.files[0].content).toContain('"showLatest": false');
  expect(item.files[0].content).toContain('"heading": "Release notes"');
});
