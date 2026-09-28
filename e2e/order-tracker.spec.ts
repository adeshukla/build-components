import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["order-tracker"].variants);
const steps = (page: Page) => page.getByRole("listitem");

for (const target of targets("order-tracker")) {
  test.describe(`order tracker — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("where the order is is said in one sentence before the list", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByText("Happening now: Out for delivery. Expected between 09:00 and 13:00.")).toBeVisible();
    });

    test("it is an ordered list with one step per stage", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.locator("ol")).toBeVisible();
      await expect(steps(page)).toHaveCount(5);
    });

    test("only the current step is aria-current=step", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.locator('[aria-current="step"]')).toHaveCount(1);
      await expect(page.locator('[aria-current="step"]')).toContainText("Out for delivery");
    });

    test("each state is a word, not a tick or a colour", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(steps(page).first()).toContainText("Done");
      await expect(steps(page).nth(3)).toContainText("Happening now");
      await expect(steps(page).nth(4)).toContainText("Still to come");
    });

    test("the markers are hidden from screen readers", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(steps(page).first().locator('[aria-hidden="true"]')).toBeVisible();
      // The tick is decoration, so it is not part of the step's text for a reader.
      await expect(steps(page).first()).toHaveAttribute("data-state", "done");
    });

    test("a step with no date yet shows none, rather than an invented one", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(steps(page).nth(4).locator("time")).toHaveCount(0);
      await expect(steps(page).first().locator("time")).toHaveAttribute("datetime", "2026-09-24");
      await expect(steps(page).first().locator("time")).toHaveText("24 September 2026");
    });

    test("nothing is focusable: it is a readout, not a control", async ({ page }) => {
      await open(page, target.url("default"));
      // Scoped to the component: the harness page around it is not what this claim is about.
      await expect(page.locator("ol").locator("button, a, input, [tabindex]")).toHaveCount(0);
    });

    test("horizontal variant: its own layout and current step", async ({ page }) => {
      await open(page, target.url("horizontal"));
      await expect(page.locator('[data-layout="horizontal"]')).toBeVisible();
      await expect(page.locator('[aria-current="step"]')).toContainText("Packed");
    });
  });
}

test("registry serves the order tracker with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/order-tracker.json?currentStep=2&layout=horizontal")).json();
  expect(item).toMatchObject({ name: "order-tracker", type: "registry:component" });
  expect(item.files[0].content).toContain('"currentStep": 2');
  expect(item.files[0].content).toContain('"layout": "horizontal"');
});
