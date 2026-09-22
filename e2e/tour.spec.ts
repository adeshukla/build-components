import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.tour.variants);
const start = (page: Page) => page.getByRole("button", { name: "Take the tour" });
const step = (page: Page) => page.getByRole("dialog");

for (const target of targets("tour")) {
  test.describe(`guided tour — ${target.name} export`, () => {
    test("no axe violations for every variant, before and during the tour", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
        await start(page).click();
        await expect(step(page)).toBeVisible();
        await expectNoAxeViolations(page);
      }
    });

    test("each step is a named dialog that takes focus, with its count", async ({ page }) => {
      await open(page, target.url("default"));
      await start(page).click();
      await expect(step(page)).toHaveAccessibleName("Search everything");
      await expect(step(page)).toHaveAccessibleDescription("Find pages, people and settings from here.");
      await expect(page.getByText("Search everything")).toBeFocused();
      await expect(step(page).getByText("Step 1 of 4")).toBeVisible();
      await expect(step(page).getByRole("button", { name: "Back" })).toBeHidden();
    });

    test("Next and Back walk the steps; the step sits beside its target", async ({ page }) => {
      await open(page, target.url("default"));
      await start(page).click();
      await step(page).getByRole("button", { name: "Next" }).click();
      await expect(step(page)).toHaveAccessibleName("Start something new");
      await expect(page.getByText("Start something new")).toBeFocused();
      const button = await page.getByRole("button", { name: "New project" }).boundingBox();
      const popup = await step(page).boundingBox();
      // Below the target, or above it when there is no room: never on top of it.
      expect(popup!.y >= button!.y + button!.height || popup!.y + popup!.height <= button!.y).toBe(true);
      await step(page).getByRole("button", { name: "Back" }).click();
      await expect(step(page)).toHaveAccessibleName("Search everything");
    });

    test("Finish, Skip and Escape all end it on the start button", async ({ page }) => {
      await open(page, target.url("default"));
      await start(page).click();
      for (let i = 0; i < 3; i++) await step(page).getByRole("button", { name: "Next" }).click();
      await step(page).getByRole("button", { name: "Finish" }).click();
      await expect(step(page)).toHaveCount(0);
      await expect(start(page)).toBeFocused();

      await start(page).click();
      await step(page).getByRole("button", { name: "Skip tour" }).click();
      await expect(start(page)).toBeFocused();

      await start(page).click();
      await page.keyboard.press("Escape");
      await expect(start(page)).toBeFocused();
      await expect(step(page)).toHaveCount(0);
    });

    test("lean variant: no step count", async ({ page }) => {
      await open(page, target.url("lean"));
      await start(page).click();
      await expect(step(page).getByText(/Step 1 of/)).toHaveCount(0);
    });
  });
}

test("registry serves the tour with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/tour.json?showDemo=false")).json();
  expect(item).toMatchObject({ name: "tour", type: "registry:component" });
  expect(item.files[0].content).toContain('"showDemo": false');
});
