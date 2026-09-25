import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["wizard"].variants);
const field = (page: Page) => page.locator("input[type=text]");
const next = (page: Page) => page.getByRole("button", { name: /Next|Send it|Send the quote/ });
const back = (page: Page) => page.getByRole("button", { name: "Back" });
const heading = (page: Page) => page.getByRole("heading", { level: 2 });
// Next injects its own role="alert" announcer on every page, so the real one is found by its text.
const alert = (page: Page) => page.getByRole("alert").filter({ hasText: "needed before you can go on" });

for (const target of targets("wizard")) {
  test.describe(`wizard — ${target.name} export`, () => {
    test("no axe violations for every variant, and on a step with an error", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await next(page).click();
      await expectNoAxeViolations(page);
    });

    test("the first step says where you are, with no way back", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(heading(page)).toContainText("Your boat");
      await expect(heading(page)).toContainText("Step 1 of 4");
      await expect(back(page)).toBeHidden();
    });

    test("a needed field blocks Next, with an alert and focus on the field", async ({ page }) => {
      await open(page, target.url("default"));
      await next(page).click();
      await expect(alert(page)).toHaveText("Boat name is needed before you can go on.");
      await expect(field(page)).toHaveAttribute("aria-invalid", "true");
      await expect(field(page)).toBeFocused();
      await expect(heading(page)).toContainText("Step 1 of 4");
    });

    test("the error clears as they type, not on blur", async ({ page }) => {
      await open(page, target.url("default"));
      await next(page).click();
      await expect(alert(page)).toBeVisible();
      await field(page).fill("Kestrel");
      await expect(alert(page)).toHaveCount(0);
      await expect(field(page)).not.toHaveAttribute("aria-invalid", "true");
    });

    test("moving on takes focus to the new step's heading", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page).fill("Kestrel");
      await next(page).click();
      await expect(heading(page)).toContainText("The work");
      await expect(heading(page)).toBeFocused();
    });

    test("going back keeps what was typed", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page).fill("Kestrel");
      await next(page).click();
      await back(page).click();
      await expect(heading(page)).toContainText("Your boat");
      await expect(field(page)).toHaveValue("Kestrel");
    });

    test("a step that is not needed can be walked past, and the end lists everything", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page).fill("Kestrel");
      await next(page).click();
      await field(page).fill("New sails");
      await next(page).click();
      // "When" is not needed, so an empty field goes through.
      await expect(heading(page)).toContainText("When");
      await next(page).click();
      await field(page).fill("ade@example.com");
      await next(page).click();
      await expect(heading(page)).toContainText("sent");
      await expect(page.getByRole("status")).toHaveText("Sent. Everything you filled in is listed above.");
      await expect(page.getByText("Kestrel")).toBeVisible();
      await expect(page.getByText("Not given")).toBeVisible();
      await expect(heading(page)).toBeFocused();
    });

    test("the step list marks where you are, in words as well", async ({ page }) => {
      await open(page, target.url("default"));
      const current = page.getByRole("listitem").filter({ hasText: "1. Your boat" });
      await expect(current).toHaveAttribute("aria-current", "step");
      await expect(current).toContainText("Current step:");
    });

    test("bare variant: no step list, renamed last button", async ({ page }) => {
      await open(page, target.url("bare"));
      await expect(page.getByRole("list")).toBeHidden();
      await expect(heading(page)).toContainText("Step 1 of 4");
      await expect(page.getByText("Get a quote", { exact: true })).toBeVisible();
    });
  });
}

test("registry serves the wizard with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/wizard.json?heading=Sign+up&showProgress=false")).json();
  expect(item).toMatchObject({ name: "wizard", type: "registry:component" });
  expect(item.files[0].content).toContain('"heading": "Sign up"');
  expect(item.files[0].content).toContain('"showProgress": false');
});
