import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["slot-picker"].variants);
const confirm = (page: Page) => page.getByRole("button", { name: /Confirm this time|Book it/ });
// The radios are visually hidden, so a person clicks the label — and so does this.
const pick = (page: Page, day: string, time: string) =>
  page.getByRole("group", { name: day }).getByText(time, { exact: true }).click();

for (const target of targets("slot-picker")) {
  test.describe(`slot picker — ${target.name} export`, () => {
    test("no axe violations for every variant, before and after picking", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await pick(page, "Thursday 5 March", "10:00");
      await expectNoAxeViolations(page);
    });

    test("it is one radio group across the days, and says how many are free", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("radio")).toHaveCount(9);
      await expect(page.getByRole("group", { name: "Friday 6 March" })).toBeVisible();
      await expect(page.getByText("7 of 9 times are free")).toBeVisible();
    });

    test("taken slots cannot be picked and say so", async ({ page }) => {
      await open(page, target.url("default"));
      const taken = page.getByRole("radio", { name: /09:30/ });
      await expect(taken).toBeDisabled();
      await expect(taken).toHaveAccessibleName(/taken/);
    });

    test("picking a time names the day as well, and confirming books it", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(confirm(page)).toBeDisabled();
      await expect(page.getByRole("status")).toHaveText("No time picked yet");
      await pick(page, "Friday 6 March", "14:00");
      await expect(page.getByRole("status")).toHaveText("Friday 6 March at 14:00 selected");
      await expect(confirm(page)).toBeEnabled();
      await confirm(page).click();
      await expect(page.getByRole("status")).toHaveText("Booked for Friday 6 March at 14:00");
    });

    test("only one time can be picked at a time", async ({ page }) => {
      await open(page, target.url("default"));
      await pick(page, "Thursday 5 March", "10:00");
      await pick(page, "Monday 9 March", "15:30");
      await expect(page.getByRole("radio", { name: /10:00/ }).first()).not.toBeChecked();
      await expect(page.getByRole("status")).toHaveText("Monday 9 March at 15:30 selected");
    });

    test("oneday variant: renamed heading and button", async ({ page }) => {
      await open(page, target.url("oneday"));
      await expect(page.getByText("Choose a slot")).toBeVisible();
      await expect(page.getByRole("button", { name: "Book it" })).toBeVisible();
    });
  });
}

test("registry serves the slot picker with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/slot-picker.json?heading=Pick+a+slot&confirmText=Book")).json();
  expect(item).toMatchObject({ name: "slot-picker", type: "registry:component" });
  expect(item.files[0].content).toContain('"heading": "Pick a slot"');
  expect(item.files[0].content).toContain('"confirmText": "Book"');
});
