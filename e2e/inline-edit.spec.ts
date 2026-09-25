import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["inline-edit"].variants);
const trigger = (page: Page) => page.getByRole("button", { name: /Edit Project name/ });
const field = (page: Page) => page.getByRole("textbox", { name: "Project name" });

for (const target of targets("inline-edit")) {
  test.describe(`inline edit — ${target.name} export`, () => {
    test("no axe violations for every variant, reading and editing", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
        await page.getByRole("button").first().click();
        await expectNoAxeViolations(page);
      }
    });

    test("the button says what it edits and what the value is", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(trigger(page)).toHaveAccessibleName(/Harbour redesign.*Edit Project name, currently Harbour redesign/);
    });

    test("Enter saves, focus returns, and the change is announced", async ({ page }) => {
      await open(page, target.url("default"));
      await trigger(page).click();
      await expect(field(page)).toBeFocused();
      await field(page).fill("Harbour redesign v2");
      await field(page).press("Enter");
      await expect(page.getByRole("status")).toHaveText("Saved. Project name is now Harbour redesign v2.");
      await expect(page.getByRole("button", { name: /Edit Project name/ })).toBeFocused();
    });

    test("Escape cancels and puts the old value back", async ({ page }) => {
      await open(page, target.url("default"));
      await trigger(page).click();
      await field(page).fill("Something else");
      await field(page).press("Escape");
      await expect(page.getByRole("status")).toHaveText("Edit cancelled. Nothing changed.");
      await expect(trigger(page)).toBeFocused();
      await expect(trigger(page)).toHaveAccessibleName(/Harbour redesign/);
    });

    test("an empty required value is refused and keeps focus", async ({ page }) => {
      await open(page, target.url("default"));
      await trigger(page).click();
      await field(page).fill("");
      await field(page).press("Enter");
      await expect(page.getByText("Project name can't be empty.")).toBeVisible();
      await expect(field(page)).toBeFocused();
    });
  });
}

test("registry serves the inline edit with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/inline-edit.json?multiline=true&required=false")).json();
  expect(item).toMatchObject({ name: "inline-edit", type: "registry:component" });
  expect(item.files[0].content).toContain('"multiline": true');
  expect(item.files[0].content).toContain('"required": false');
});
