import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["date-range"].variants);
const from = (page: Page) => page.locator("input[type=date]").first();
const to = (page: Page) => page.locator("input[type=date]").nth(1);

for (const target of targets("date-range")) {
  test.describe(`date range — ${target.name} export`, () => {
    test("no axe violations for every variant, filled and out of order", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await from(page).fill("2026-03-18");
      await to(page).fill("2026-03-04");
      await expectNoAxeViolations(page);
    });

    test("two native date fields under one legend", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("group", { name: /When are you staying/ })).toBeVisible();
      await expect(page.locator("input[type=date]")).toHaveCount(2);
      await expect(from(page)).toHaveAccessibleName(/Check in/);
      await expect(to(page)).toHaveAccessibleName(/Check out/);
    });

    test("the span is said in words once both ends are set", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("status")).toHaveText("");
      await from(page).fill("2026-03-04");
      await to(page).fill("2026-03-18");
      await expect(page.getByRole("status")).toHaveText("14 nights, 4 March 2026 to 18 March 2026");
    });

    test("each field narrows the other's limits", async ({ page }) => {
      await open(page, target.url("default"));
      await from(page).fill("2026-03-04");
      await expect(to(page)).toHaveAttribute("min", "2026-03-04");
      await to(page).fill("2026-03-18");
      await expect(from(page)).toHaveAttribute("max", "2026-03-18");
    });

    test("out of order is refused in words, straight away", async ({ page }) => {
      await open(page, target.url("default"));
      await from(page).fill("2026-03-18");
      await to(page).fill("2026-03-04");
      await expect(page.getByRole("alert").filter({ hasText: "cannot be before" })).toBeVisible();
      await expect(to(page)).toHaveAttribute("aria-invalid", "true");
      await expect(page.getByRole("status")).toHaveText("");
      // Putting it right clears both the message and the mark.
      await to(page).fill("2026-03-20");
      await expect(page.getByRole("alert").filter({ hasText: "cannot be before" })).toHaveCount(0);
      await expect(to(page)).not.toHaveAttribute("aria-invalid", "true");
    });

    test("days variant counts both ends and has its own limits", async ({ page }) => {
      await open(page, target.url("days"));
      await from(page).fill("2026-03-04");
      await to(page).fill("2026-03-06");
      await expect(page.getByRole("status")).toHaveText("3 days, 4 March 2026 to 6 March 2026");
      await expect(from(page)).toHaveAttribute("min", "2026-01-01");
    });
  });
}

test("registry serves the date range with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/date-range.json?name=trip&spanUnit=days")).json();
  expect(item).toMatchObject({ name: "date-range", type: "registry:component" });
  expect(item.files[0].content).toContain('"name": "trip"');
  expect(item.files[0].content).toContain('"spanUnit": "days"');
});
