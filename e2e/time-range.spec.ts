import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["time-range"].variants);
const from = (page: Page) => page.locator("input[type=time]").first();
const to = (page: Page) => page.locator("input[type=time]").nth(1);

for (const target of targets("time-range")) {
  test.describe(`time range — ${target.name} export`, () => {
    test("no axe violations for every variant, filled and backwards", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await from(page).fill("18:00");
      await to(page).fill("09:00");
      await expectNoAxeViolations(page);
    });

    test("two native time fields under one legend, sharing one step", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("group", { name: /When are you open/ })).toBeVisible();
      await expect(page.locator("input[type=time]")).toHaveCount(2);
      await expect(from(page)).toHaveAttribute("step", "1800");
      await expect(to(page)).toHaveAttribute("step", "1800");
      await expect(from(page)).toHaveAttribute("min", "06:00");
    });

    test("how long it is is said in words, not as a clock time", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("status")).toHaveText("");
      await from(page).fill("09:00");
      await to(page).fill("12:30");
      await expect(page.getByRole("status")).toHaveText("3 hours 30 minutes");
      await to(page).fill("10:00");
      await expect(page.getByRole("status")).toHaveText("1 hour");
    });

    test("backwards is refused in words unless overnight is allowed", async ({ page }) => {
      await open(page, target.url("default"));
      await from(page).fill("18:00");
      await to(page).fill("09:00");
      await expect(page.getByRole("alert").filter({ hasText: "must be after" })).toBeVisible();
      await expect(to(page)).toHaveAttribute("aria-invalid", "true");
      await expect(page.getByRole("status")).toHaveText("");
    });

    test("overnight variant: it wraps past midnight and says so", async ({ page }) => {
      await open(page, target.url("overnight"));
      await from(page).fill("22:00");
      await to(page).fill("02:00");
      await expect(page.getByRole("alert").filter({ hasText: "must be after" })).toHaveCount(0);
      await expect(page.getByRole("status")).toHaveText("4 hours, finishing the next day");
    });
  });
}

test("registry serves the time range with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/time-range.json?name=shift&allowOvernight=true")).json();
  expect(item).toMatchObject({ name: "time-range", type: "registry:component" });
  expect(item.files[0].content).toContain('"name": "shift"');
  expect(item.files[0].content).toContain('"allowOvernight": true');
});
