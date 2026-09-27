import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["cursor-pagination"].variants);
const newer = (page: Page) => page.getByRole("button", { name: /Newer|Previous/ });
const older = (page: Page) => page.getByRole("button", { name: /Older|Next/ });
const rows = (page: Page) => page.getByRole("listitem");

for (const target of targets("cursor-pagination")) {
  test.describe(`cursor pagination — ${target.name} export`, () => {
    test("no axe violations for every variant, at the start, middle and end", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await older(page).click();
      await expectNoAxeViolations(page);
      // Three more reaches the last page; a fourth would be a click on an aria-disabled button.
      for (let step = 0; step < 3; step++) await older(page).click();
      await expectNoAxeViolations(page);
    });

    test("two buttons in a named nav, and no page numbers", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("navigation", { name: "Results" })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Results" }).getByRole("button")).toHaveCount(2);
      await expect(rows(page)).toHaveCount(5);
    });

    test("the ends are aria-disabled, still focusable, and say why", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(newer(page)).toHaveAttribute("aria-disabled", "true");
      // Focusable is the point: a disabled button could never be read.
      await newer(page).focus();
      await expect(newer(page)).toBeFocused();
      await expect(newer(page)).toHaveAccessibleDescription("You are on the newest page.");
      // Playwright will not click an aria-disabled control, so force it the way a determined person would.
      await newer(page).click({ force: true });
      await expect(rows(page).first()).toContainText("#1");
    });

    test("the last page is found by coming back short", async ({ page }) => {
      await open(page, target.url("default"));
      for (let step = 0; step < 4; step++) await older(page).click();
      // 23 rows, 5 at a time: the fifth page holds three.
      await expect(rows(page)).toHaveCount(3);
      await expect(older(page)).toHaveAttribute("aria-disabled", "true");
      await expect(older(page)).toHaveAccessibleDescription("You have reached the end.");
    });

    test("each page announces which rows it is", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("status")).toHaveText("Showing entry 1 to 5");
      await older(page).click();
      await expect(page.getByRole("status")).toHaveText("Showing entry 6 to 10");
    });

    test("loading a page moves focus to the list heading", async ({ page }) => {
      await open(page, target.url("default"));
      await older(page).click();
      await expect(page.getByRole("heading", { name: "Build log" })).toBeFocused();
    });

    test("counted variant: the total is in the range line", async ({ page }) => {
      await open(page, target.url("counted"));
      await expect(page.getByRole("status")).toHaveText("Showing row 1 to 4 of 12");
    });
  });
}

test("registry serves the cursor pagination with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/cursor-pagination.json?pageSize=4&knowsTotal=true")).json();
  expect(item).toMatchObject({ name: "cursor-pagination", type: "registry:component" });
  expect(item.files[0].content).toContain('"pageSize": 4');
  expect(item.files[0].content).toContain('"knowsTotal": true');
});
