import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.toast.variants);
const press = (page: Page, name: string) => page.getByRole("button", { name });
const stack = (page: Page) => page.getByRole("region", { name: "Notifications" });

for (const target of targets("toast")) {
  test.describe(`notifications — ${target.name} export`, () => {
    test("no axe violations, empty and with messages, for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
        await page.getByRole("button").first().click();
        await expectNoAxeViolations(page);
      }
    });

    test("the live region is in the page before any message arrives", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(stack(page)).toBeAttached();
      await expect(stack(page).locator("[aria-live='polite']")).toBeAttached();
      await expect(page.getByText("Your changes have been saved.")).toHaveCount(0);
    });

    test("a message appears, and the close button removes it", async ({ page }) => {
      await open(page, target.url("default"));
      await press(page, "Save changes").click();
      await expect(page.getByText("Your changes have been saved.")).toBeVisible();

      await press(page, "Close this message").click();
      await expect(page.getByText("Your changes have been saved.")).toHaveCount(0);
    });

    test("the problem message says what to do next", async ({ page }) => {
      await open(page, target.url("default"));
      await press(page, "Save without a connection").click();
      await expect(page.getByText("We could not save your changes. Check your connection and try again.")).toBeVisible();
    });

    test("only as many messages as you allow are kept", async ({ page }) => {
      await open(page, target.url("default"));
      for (let i = 0; i < 5; i++) await press(page, "Save changes").click();
      await expect(page.getByText("Your changes have been saved.")).toHaveCount(3); // maxVisible
    });

    test("the action inside a message closes it", async ({ page }) => {
      await open(page, target.url("default"));
      await press(page, "Save changes").click();
      await press(page, "Undo").click();
      await expect(page.getByText("Your changes have been saved.")).toHaveCount(0);
    });

    test("quick variant: messages clear themselves after their time", async ({ page }) => {
      await open(page, target.url("quick"));
      await press(page, "Save changes").click();
      await expect(page.getByText("Your changes have been saved.")).toBeVisible();
      // One second on screen, so it should be gone well inside the timeout.
      await expect(page.getByText("Your changes have been saved.")).toHaveCount(0, { timeout: 5000 });
    });
  });
}

test("registry serves the notifications with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/toast.json?position=middle&duration=99&maxVisible=99")).json();
  expect(item).toMatchObject({ name: "toast", type: "registry:component" });
  expect(item.files[0].content).toContain('"position": "bottom-right"'); // unknown value falls back
  expect(item.files[0].content).toContain('"duration": 20'); // clamped to the schema maximum
  expect(item.files[0].content).toContain('"maxVisible": 6');
});
