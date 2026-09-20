import { expect, test } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.stepper.variants);

for (const target of targets("stepper")) {
  test.describe(`stepper — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("the run is named, and says where you are", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("navigation", { name: "Checkout" })).toBeVisible();
      await expect(page.getByText("Step 3 of 4: Payment")).toBeVisible();
      await expect(page.getByRole("listitem").nth(2)).toHaveAttribute("aria-current", "step");
    });

    test("each step says its state in words, not just in colour", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByText("Basket (completed)")).toBeAttached();
      await expect(page.getByText("Payment (current step)")).toBeAttached();
      await expect(page.getByText("Confirm (not started)")).toBeAttached();
    });

    test("finished steps can be gone back to, later ones cannot", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("link", { name: /Basket/ })).toHaveAttribute("href", "/basket");
      await expect(page.getByRole("link", { name: /Delivery/ })).toHaveAttribute("href", "/delivery");
      await expect(page.getByRole("link", { name: /Payment/ })).toHaveCount(0);
      await expect(page.getByRole("link", { name: /Confirm/ })).toHaveCount(0);
    });

    test("locked variant: nothing is a link, and the count is off", async ({ page }) => {
      await open(page, target.url("locked"));
      await expect(page.getByRole("link")).toHaveCount(0);
      await expect(page.getByText(/^Step \d of/)).toHaveCount(0);
      await expect(page.getByText("Delivery (current step)")).toBeAttached();
    });
  });
}

test("registry serves the stepper with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/stepper.json?current=99&marker=star&label=Onboarding")).json();
  expect(item).toMatchObject({ name: "stepper", type: "registry:component" });
  expect(item.files[0].content).toContain('"label": "Onboarding"');
  expect(item.files[0].content).toContain('"current": 8'); // clamped to the schema maximum
  expect(item.files[0].content).toContain('"marker": "number"'); // unknown value falls back
});
