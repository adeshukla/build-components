import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["timeline"].variants);
const entries = (page: Page) => page.getByRole("listitem");
const more = (page: Page) => page.getByRole("button", { name: /Show older/ });

for (const target of targets("timeline")) {
  test.describe(`timeline — ${target.name} export`, () => {
    test("no axe violations for every variant, before and after revealing", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await more(page).click();
      await expectNoAxeViolations(page);
    });

    test("it shows the newest few, with the number left on the button", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(entries(page)).toHaveCount(3);
      await expect(more(page)).toHaveText("Show older (3)");
      await expect(page.getByText("moved Anchor plan to In review")).toBeVisible();
    });

    test("revealing the rest says so and moves focus to the first one that arrived", async ({ page }) => {
      await open(page, target.url("default"));
      await more(page).click();
      await expect(entries(page)).toHaveCount(6);
      await expect(page.getByRole("status")).toHaveText("Showing all 6 entries");
      await expect(more(page)).toHaveCount(0);
      await expect(entries(page).nth(3)).toBeFocused();
    });

    test("each time is a real time element with a machine-readable stamp", async ({ page }) => {
      await open(page, target.url("default"));
      const first = page.locator("time").first();
      await expect(first).toHaveText("4 March, 9:12");
      await expect(first).toHaveAttribute("datetime", "2026-03-04T09:12");
    });

    test("full variant: everything shown, oldest first, no button", async ({ page }) => {
      await open(page, target.url("full"));
      await expect(entries(page)).toHaveCount(6);
      await expect(more(page)).toHaveCount(0);
      await expect(entries(page).first()).toContainText("created the workspace");
    });
  });
}

test("registry serves the timeline with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/timeline.json?initialCount=2&newestFirst=false")).json();
  expect(item).toMatchObject({ name: "timeline", type: "registry:component" });
  expect(item.files[0].content).toContain('"initialCount": 2');
  expect(item.files[0].content).toContain('"newestFirst": false');
});
