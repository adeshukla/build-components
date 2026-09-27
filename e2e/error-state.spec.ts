import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["error-state"].variants);
const trigger = (page: Page) => page.getByRole("button", { name: /Load the report/ });
const panel = (page: Page) => page.locator("[data-panel]");
const retry = (page: Page) => page.getByRole("button", { name: "Try again" });

for (const target of targets("error-state")) {
  test.describe(`error state — ${target.name} export`, () => {
    test("no axe violations for every variant, before and after it fails", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("stuck"));
      await trigger(page).click();
      await expect(panel(page)).toBeVisible();
      await expectNoAxeViolations(page);
    });

    test("nothing is shown before anything has failed", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(panel(page)).toBeHidden();
    });

    test("it is a focusable region with a heading, not an alert", async ({ page }) => {
      await open(page, target.url("stuck"));
      await trigger(page).click();
      await expect(panel(page)).toHaveAttribute("tabindex", "-1");
      await expect(panel(page)).toHaveAccessibleName("The report did not load");
      await expect(page.locator("[role=alert]:not(#__next-route-announcer__)")).toHaveCount(0);
    });

    test("focus goes to the panel, not to the retry button", async ({ page }) => {
      await open(page, target.url("stuck"));
      await trigger(page).click();
      await expect(panel(page)).toBeFocused();
      await expect(retry(page)).not.toBeFocused();
    });

    test("it names what failed, what happened and whether anything changed", async ({ page }) => {
      await open(page, target.url("stuck"));
      await trigger(page).click();
      await expect(page.getByRole("heading", { name: "The report did not load" })).toBeVisible();
      await expect(panel(page)).toContainText("took too long to answer");
      await expect(panel(page)).toContainText("Nothing was changed");
    });

    test("the technical line is a disclosure, closed to begin with", async ({ page }) => {
      await open(page, target.url("stuck"));
      await trigger(page).click();
      const detail = page.getByText("504 Gateway Timeout", { exact: false });
      await expect(detail).toBeHidden();
      await page.getByRole("group", { name: /did not load/ }).getByText("Technical detail").click();
      await expect(detail).toBeVisible();
    });

    test("retrying can work, and says so", async ({ page }) => {
      await open(page, target.url("default"));
      await trigger(page).click();
      await expect(panel(page)).toBeVisible();
      await retry(page).click();
      await expect(panel(page)).toBeHidden();
      await expect(page.getByRole("status")).toHaveText("Report loaded.");
    });

    test("stuck variant: retrying keeps the panel and the focus", async ({ page }) => {
      await open(page, target.url("stuck"));
      await trigger(page).click();
      await retry(page).click();
      await expect(panel(page)).toBeVisible();
      await expect(panel(page)).toBeFocused();
    });
  });
}

test("registry serves the error state with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/error-state.json?showDetails=false&retryLabel=Reload")).json();
  expect(item).toMatchObject({ name: "error-state", type: "registry:component" });
  expect(item.files[0].content).toContain('"showDetails": false');
  expect(item.files[0].content).toContain('"retryLabel": "Reload"');
});
