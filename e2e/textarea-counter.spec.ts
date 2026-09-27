import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["textarea-counter"].variants);
const field = (page: Page) => page.getByRole("textbox");
const counter = (page: Page) => page.getByText(/characters? (left|over the limit)/).first();

for (const target of targets("textarea-counter")) {
  test.describe(`textarea counter — ${target.name} export`, () => {
    test("no axe violations for every variant, empty, warning and over", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await field(page).fill("x".repeat(210));
      await expectNoAxeViolations(page);
    });

    test("the counter is part of the field's description", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(counter(page)).toHaveText("200 characters left");
      await expect(field(page)).toHaveAccessibleDescription(/200 characters left/);
    });

    test("it counts down as you type", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page).fill("Twenty characters!!!");
      await expect(counter(page)).toHaveText("180 characters left");
    });

    test("going over is an error, not a silent truncation", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page).fill("y".repeat(205));
      await expect(field(page)).toHaveValue("y".repeat(205));
      await expect(counter(page)).toHaveText("5 characters over the limit");
      await expect(field(page)).toHaveAttribute("aria-invalid", "true");
      await expect(page.getByRole("alert").filter({ hasText: "over the limit" })).toBeVisible();
      await field(page).fill("y".repeat(10));
      await expect(field(page)).not.toHaveAttribute("aria-invalid", "true");
    });

    test("the running number is not a live region", async ({ page }) => {
      await open(page, target.url("default"));
      // Only the sr-only status line may be live; the visible counter must not be.
      const live = page.locator("[aria-live], [role=status]").filter({ hasText: /characters left/ });
      await expect(live).toHaveCount(0);
    });

    test("hard variant: the browser stops the typing at the limit", async ({ page }) => {
      await open(page, target.url("hard"));
      await field(page).fill("z".repeat(80));
      await expect(field(page)).toHaveValue("z".repeat(60));
      await expect(counter(page)).toHaveText("0 characters left");
    });
  });
}

test("registry serves the textarea counter with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/textarea-counter.json?maxLength=500&allowOver=false")).json();
  expect(item).toMatchObject({ name: "textarea-counter", type: "registry:component" });
  expect(item.files[0].content).toContain('"maxLength": 500');
  expect(item.files[0].content).toContain('"allowOver": false');
});
