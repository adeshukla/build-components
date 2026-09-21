import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["multi-select"].variants);
const box = (page: Page) => page.getByRole("combobox");
const option = (page: Page, name: string) => page.getByRole("option", { name, exact: false });
const chip = (page: Page, name: string) => page.getByRole("button", { name: `Remove ${name}` });

for (const target of targets("multi-select")) {
  test.describe(`multi-select — ${target.name} export`, () => {
    test("no axe violations, closed and open, for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
        await box(page).click();
        await expectNoAxeViolations(page);
      }
    });

    test("the list says it takes several choices, and each option says whether it is chosen", async ({ page }) => {
      await open(page, target.url("default"));
      await box(page).click();
      const list = page.getByRole("listbox", { name: "Skills" });
      await expect(list).toHaveAttribute("aria-multiselectable", "true");
      await expect(option(page, "Research")).toHaveAttribute("aria-selected", "false");

      await option(page, "Research").click();
      await expect(option(page, "Research")).toHaveAttribute("aria-selected", "true");
    });

    test("choosing adds a button that takes it off again", async ({ page }) => {
      await open(page, target.url("default"));
      await box(page).click();
      await option(page, "Testing").click();
      await expect(chip(page, "Testing")).toBeVisible();

      await chip(page, "Testing").click();
      await expect(chip(page, "Testing")).toHaveCount(0);
      await expect(option(page, "Testing")).toHaveAttribute("aria-selected", "false");
    });

    test("typing narrows the list, and the caret stays in the box", async ({ page }) => {
      await open(page, target.url("default"));
      await box(page).click();
      await box(page).fill("ty");
      await expect(option(page, "Typography")).toBeVisible();
      await expect(option(page, "Research")).toBeHidden();
      await expect(box(page)).toBeFocused();
    });

    test("the arrows point at an option without taking focus, and Enter picks it", async ({ page }) => {
      await open(page, target.url("default"));
      await box(page).click();
      await page.keyboard.press("ArrowDown");
      await expect(box(page)).toHaveAttribute("aria-activedescendant", /multi-select-option/);
      await expect(box(page)).toBeFocused();

      await page.keyboard.press("Enter");
      await expect(page.getByRole("button", { name: /^Remove / })).toHaveCount(1);
    });

    test("Backspace on an empty box takes the last choice off", async ({ page }) => {
      await open(page, target.url("default"));
      await box(page).click();
      await option(page, "Animation").click();
      await option(page, "Research").click();
      await expect(page.getByRole("button", { name: /^Remove / })).toHaveCount(2);

      await box(page).press("Backspace");
      await expect(page.getByRole("button", { name: /^Remove / })).toHaveCount(1);
      await expect(chip(page, "Animation")).toBeVisible();
    });

    test("clear all empties the choices", async ({ page }) => {
      await open(page, target.url("default"));
      await box(page).click();
      await option(page, "Animation").click();
      await option(page, "Testing").click();
      await page.getByRole("button", { name: "Clear all" }).click();
      await expect(page.getByRole("button", { name: /^Remove / })).toHaveCount(0);
    });

    test("capped variant: the limit holds, and says so", async ({ page }) => {
      await open(page, target.url("capped"));
      await box(page).click();
      await option(page, "Red").click();
      await option(page, "Green").click();
      await expect(page.getByRole("button", { name: /^Remove / })).toHaveCount(2);

      await option(page, "Blue").click();
      await expect(page.getByRole("button", { name: /^Remove / })).toHaveCount(2);
      await expect(option(page, "Blue")).toHaveAttribute("aria-selected", "false");
    });
  });
}

test("registry serves the multi-select with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/multi-select.json?maxSelected=99&filter=fuzzy&label=Tags")).json();
  expect(item).toMatchObject({ name: "multi-select", type: "registry:component" });
  expect(item.files[0].content).toContain('"label": "Tags"');
  expect(item.files[0].content).toContain('"maxSelected": 20'); // clamped to the schema maximum
  expect(item.files[0].content).toContain('"filter": "contains"'); // unknown value falls back
});
