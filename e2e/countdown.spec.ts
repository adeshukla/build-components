import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["countdown"].variants);
const boxes = (page: Page) => page.locator("[aria-hidden=true] li, li");

for (const target of targets("countdown")) {
  test.describe(`countdown — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("it counts down in the browser and says the coarse reading", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(boxes(page)).toHaveCount(4);
      // Days and hours, not "3 days, 4 hours, 12 minutes and 9 seconds" every second.
      await expect(page.getByRole("status")).toHaveText(/^\d+ days? and \d+ hours? left$/);
    });

    test("the digits are hidden from the reading order", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.locator("ol[aria-hidden=true]")).toHaveCount(1);
      await expect(page.getByRole("list")).toHaveCount(0);
    });

    test("the seconds tick", async ({ page }) => {
      await open(page, target.url("default"));
      const seconds = boxes(page).last().locator("span").first();
      const first = await seconds.textContent();
      await expect.poll(async () => await seconds.textContent(), { timeout: 4000 }).not.toBe(first);
    });

    test("finished variant: a moment already past shows the finished line instead", async ({ page }) => {
      await open(page, target.url("finished"));
      // The line and the status both say it, which is the point: one is seen, one is heard.
      await expect(page.getByText("Doors are open.").first()).toBeVisible();
      await expect(page.getByRole("status")).toHaveText("Doors are open.");
      // React drops the digits, the plain version hides them: either way they are gone.
      await expect(page.locator("ol")).toBeHidden();
    });

    test("minutes variant: no seconds box", async ({ page }) => {
      await open(page, target.url("minutes"));
      await expect(boxes(page)).toHaveCount(3);
      await expect(page.getByText("Sale ends in")).toBeVisible();
    });
  });
}

test("registry serves the countdown with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/countdown.json?label=Launch+in&showSeconds=false")).json();
  expect(item).toMatchObject({ name: "countdown", type: "registry:component" });
  expect(item.files[0].content).toContain('"label": "Launch in"');
  expect(item.files[0].content).toContain('"showSeconds": false');
});
