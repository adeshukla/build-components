import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["reading-progress"].variants);
const bar = (page: Page) => page.getByRole("progressbar", { name: "Reading progress" });

for (const target of targets("reading-progress")) {
  test.describe(`reading progress — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("the bar reports a percentage that grows as you read", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(bar(page)).toHaveAttribute("aria-valuetext", "0% read");
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await expect(bar(page)).toHaveAttribute("aria-valuenow", "100");
      await expect(bar(page)).toHaveAttribute("aria-valuetext", "100% read");
    });

    test("the contents list marks the section you are in", async ({ page }) => {
      await open(page, target.url("default"));
      const contents = page.getByRole("navigation", { name: "On this page" });
      await expect(contents.getByRole("link", { name: /What this is/ })).toHaveAttribute("aria-current", "location");
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await expect(contents.getByRole("link", { name: /Accessibility notes/ })).toHaveAttribute("aria-current", "location");
      await expect(contents.getByRole("link", { name: /What this is/ })).not.toHaveAttribute("aria-current", "location");
    });

    test("bar variant: no contents list", async ({ page }) => {
      await open(page, target.url("bar"));
      await expect(page.getByRole("navigation")).toHaveCount(0);
      // Zero progress means zero width, so it is attached rather than visible until you scroll.
      await expect(bar(page)).toBeAttached();
      await expect(bar(page)).toHaveAttribute("aria-valuenow", "0");
    });
  });
}

test("registry serves reading progress with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/reading-progress.json?showBar=false")).json();
  expect(item).toMatchObject({ name: "reading-progress", type: "registry:component" });
  expect(item.files[0].content).toContain('"showBar": false');
});
