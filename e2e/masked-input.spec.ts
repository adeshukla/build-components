import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["masked-input"].variants);
const field = (page: Page) => page.getByRole("textbox");

for (const target of targets("masked-input")) {
  test.describe(`masked input — ${target.name} export`, () => {
    test("no axe violations for every variant, and while incomplete", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await field(page).fill("TR1");
      await field(page).blur();
      await expectNoAxeViolations(page);
    });

    test("the shape is said before anything is typed", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(field(page)).toHaveAccessibleDescription(/Like XX00 0XX/);
    });

    test("punctuation is added for you", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page).pressSequentially("tr112ab");
      await expect(field(page)).toHaveValue("TR11 2AB");
      await expect(page.getByRole("status")).toHaveText("Postcode complete: TR11 2AB");
    });

    test("pasting it with the space already in works too", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page).fill("tr11 2ab");
      await expect(field(page)).toHaveValue("TR11 2AB");
    });

    test("characters that cannot go in a slot are skipped, not refused", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page).fill("9tr!11$2ab");
      await expect(field(page)).toHaveValue("TR11 2AB");
    });

    test("leaving it half-typed says what is missing", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page).fill("TR11");
      await field(page).blur();
      await expect(page.getByRole("alert").filter({ hasText: "not a full postcode" })).toBeVisible();
      await expect(field(page)).toHaveAttribute("aria-invalid", "true");
    });

    test("date variant: its own mask and the numeric keyboard", async ({ page }) => {
      await open(page, target.url("date"));
      await expect(field(page)).toHaveAttribute("inputmode", "numeric");
      await field(page).pressSequentially("04031926");
      await expect(field(page)).toHaveValue("04/03/1926");
    });
  });
}

test("registry serves the masked input with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/masked-input.json?mask=%23%23%23-%23%23%23&name=ref")).json();
  expect(item).toMatchObject({ name: "masked-input", type: "registry:component" });
  expect(item.files[0].content).toContain('"mask": "###-###"');
  expect(item.files[0].content).toContain('"name": "ref"');
});
