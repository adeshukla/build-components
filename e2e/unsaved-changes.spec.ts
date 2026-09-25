import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["unsaved-changes"].variants);
const field = (page: Page) => page.getByRole("textbox", { name: "Draft note" });
const leave = (page: Page) => page.getByRole("button", { name: /Back to all notes|Close editor/ });
const dirtyLine = (page: Page) => page.getByRole("status").first();
const result = (page: Page) => page.getByRole("status").last();

for (const target of targets("unsaved-changes")) {
  test.describe(`unsaved changes — ${target.name} export`, () => {
    test("no axe violations for every variant, clean and asking", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
        await field(page).fill("Something");
        await leave(page).click();
        await expect(page.getByRole("dialog")).toBeVisible();
        await expectNoAxeViolations(page);
      }
    });

    test("with nothing typed it just leaves", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(dirtyLine(page)).toHaveText("Nothing to save");
      await leave(page).click();
      await expect(page.getByRole("dialog")).toBeHidden();
      await expect(result(page)).toHaveText("Left with nothing unsaved");
    });

    test("typing marks it unsaved and leaving asks first", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page).fill("Half a thought");
      await expect(dirtyLine(page)).toHaveText("Unsaved changes");
      await leave(page).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByRole("button", { name: "Keep editing" })).toBeFocused();
    });

    test("Escape keeps editing and keeps the text", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page).fill("Half a thought");
      await leave(page).click();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toBeHidden();
      await expect(field(page)).toHaveValue("Half a thought");
      await expect(leave(page)).toBeFocused();
    });

    test("discarding clears the text and says what happened", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page).fill("Half a thought");
      await leave(page).click();
      await page.getByRole("button", { name: "Discard and leave" }).click();
      await expect(field(page)).toHaveValue("");
      await expect(dirtyLine(page)).toHaveText("Nothing to save");
      await expect(result(page)).toHaveText("Left, changes discarded");
    });

    test("saving makes leaving quiet again", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page).fill("Worth keeping");
      await page.getByRole("button", { name: "Save" }).click();
      await expect(dirtyLine(page)).toHaveText("Nothing to save");
      await leave(page).click();
      await expect(page.getByRole("dialog")).toBeHidden();
      await expect(result(page)).toHaveText("Left with nothing unsaved");
    });
  });
}

test("registry serves the unsaved changes guard with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/unsaved-changes.json?label=Reply&warnOnReload=false")).json();
  expect(item).toMatchObject({ name: "unsaved-changes", type: "registry:component" });
  expect(item.files[0].content).toContain('"label": "Reply"');
  expect(item.files[0].content).toContain('"warnOnReload": false');
});
