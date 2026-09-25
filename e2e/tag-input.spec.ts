import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["tag-input"].variants);
const field = (page: Page) => page.getByRole("textbox", { name: "Skills" });

for (const target of targets("tag-input")) {
  test.describe(`tag input — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("Enter adds a tag, and it is announced with the count", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page).fill("Testing");
      await field(page).press("Enter");
      await expect(page.getByRole("listitem")).toHaveCount(3);
      await expect(page.getByRole("button", { name: "Remove Testing" })).toBeVisible();
      await expect(page.getByRole("status")).toHaveText("Testing added. 3 of 8.");
      await expect(field(page)).toHaveValue("");
    });

    test("Backspace in an empty field removes the last tag", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page).press("Backspace");
      await expect(page.getByRole("button", { name: "Remove CSS" })).toHaveCount(0);
      await expect(page.getByRole("status")).toHaveText("CSS removed. 1 of 8.");
      await expect(field(page)).toBeFocused();
    });

    test("duplicates are refused with a reason", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page).fill("css");
      await field(page).press("Enter");
      await expect(page.getByRole("status")).toHaveText("css is already in the list.");
      await expect(page.getByRole("listitem")).toHaveCount(2);
    });

    test("the limit is explained rather than silently enforced", async ({ page }) => {
      await open(page, target.url("loose"));
      await field(page).fill("One");
      await field(page).press("Enter");
      await field(page).fill("Two");
      await field(page).press("Enter");
      await expect(page.getByRole("status")).toHaveText("You can add 3 at most. Remove one first.");
    });
  });
}

test("registry serves the tag input with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/tag-input.json?maxTags=99&allowDuplicates=true")).json();
  expect(item).toMatchObject({ name: "tag-input", type: "registry:component" });
  expect(item.files[0].content).toContain('"allowDuplicates": true');
  expect(item.files[0].content).toContain('"maxTags": 30'); // clamped to the schema maximum
});
