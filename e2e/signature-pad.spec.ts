import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["signature-pad"].variants);
const typed = (page: Page) => page.getByRole("textbox", { name: "Or type your full name instead" });
const confirm = (page: Page) => page.getByRole("button", { name: /Confirm signature/ });
const canvas = (page: Page) => page.getByRole("img", { name: /Sign|delivery note/ });

/** Draws a short stroke the way a finger or a mouse would. */
async function draw(page: Page) {
  const box = await canvas(page).boundingBox();
  if (!box) throw new Error("no canvas");
  await page.mouse.move(box.x + 40, box.y + 40);
  await page.mouse.down();
  await page.mouse.move(box.x + 120, box.y + 90, { steps: 8 });
  await page.mouse.move(box.x + 200, box.y + 50, { steps: 8 });
  await page.mouse.up();
}

for (const target of targets("signature-pad")) {
  test.describe(`signature pad — ${target.name} export`, () => {
    test("no axe violations for every variant, empty and signed", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await typed(page).fill("Adesh Shukla");
      await expectNoAxeViolations(page);
    });

    test("typing the name counts as signing, with no pointer used at all", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("status")).toHaveText("Nothing signed yet");
      await expect(confirm(page)).toBeDisabled();
      await typed(page).fill("Adesh Shukla");
      await expect(confirm(page)).toBeEnabled();
      await confirm(page).click();
      await expect(page.getByRole("status")).toHaveText("Signed as Adesh Shukla");
    });

    test("drawing counts too, and says so differently", async ({ page }) => {
      await open(page, target.url("default"));
      await draw(page);
      await expect(page.getByRole("status")).toHaveText("There is a signature");
      await confirm(page).click();
      await expect(page.getByRole("status")).toHaveText("Signed by drawing");
    });

    test("clearing empties both ways of signing and says it cleared", async ({ page }) => {
      await open(page, target.url("default"));
      await typed(page).fill("Adesh Shukla");
      await draw(page);
      await page.getByRole("button", { name: "Clear" }).click();
      await expect(typed(page)).toHaveValue("");
      await expect(confirm(page)).toBeDisabled();
      await expect(page.getByRole("status")).toHaveText("Signature cleared");
    });

    test("the canvas is a labelled image, not an unnamed blank", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(canvas(page)).toHaveAccessibleName("Sign here");
      await expect(canvas(page)).toHaveAccessibleDescription(/type your name instead/);
    });

    test("drawonly variant: no typed field, drawing still works", async ({ page }) => {
      await open(page, target.url("drawonly"));
      await expect(page.getByRole("textbox")).toHaveCount(0);
      await draw(page);
      await expect(confirm(page)).toBeEnabled();
    });
  });
}

test("registry serves the signature pad with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/signature-pad.json?label=Sign+off&typedAlternative=false")).json();
  expect(item).toMatchObject({ name: "signature-pad", type: "registry:component" });
  expect(item.files[0].content).toContain('"label": "Sign off"');
  expect(item.files[0].content).toContain('"typedAlternative": false');
});
