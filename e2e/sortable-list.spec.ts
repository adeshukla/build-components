import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["sortable-list"].variants);
const order = (page: Page) => page.getByRole("list", { name: "Your priorities" }).getByRole("listitem");
const handle = (page: Page, name: string) => page.getByRole("button", { name: `Reorder ${name}` });
const status = (page: Page) => page.getByRole("status");

for (const target of targets("sortable-list")) {
  test.describe(`sortable list — ${target.name} export`, () => {
    test("no axe violations for every variant, and while an item is picked up", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await handle(page, "Plan next sprint").focus();
      await page.keyboard.press("Space");
      await expectNoAxeViolations(page);
    });

    test("Space picks up, the arrows move, Space drops, and every step is announced", async ({ page }) => {
      await open(page, target.url("default"));
      const plan = handle(page, "Plan next sprint");
      await plan.focus();
      await page.keyboard.press("Space");
      await expect(plan).toHaveAttribute("aria-pressed", "true");
      await expect(status(page)).toContainText("Picked up Plan next sprint, position 4 of 5");
      await page.keyboard.press("ArrowUp");
      await page.keyboard.press("ArrowUp");
      await expect(status(page)).toHaveText("Plan next sprint moved to position 2 of 5.");
      await expect(plan).toBeFocused();
      await page.keyboard.press("Space");
      await expect(plan).toHaveAttribute("aria-pressed", "false");
      await expect(status(page)).toHaveText("Plan next sprint dropped at position 2 of 5.");
      await expect(order(page).nth(1)).toContainText("Plan next sprint");
    });

    test("Escape puts everything back", async ({ page }) => {
      await open(page, target.url("default"));
      await handle(page, "Fix the checkout bug").focus();
      await page.keyboard.press("Enter");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      await expect(order(page).nth(2)).toContainText("Fix the checkout bug");
      await page.keyboard.press("Escape");
      await expect(order(page).first()).toContainText("Fix the checkout bug");
      await expect(status(page)).toHaveText("Cancelled. Fix the checkout bug is back at position 1 of 5.");
      await expect(handle(page, "Fix the checkout bug")).toBeFocused();
    });

    test("the move buttons reorder without dragging, and keep focus", async ({ page }) => {
      await open(page, target.url("default"));
      const down = page.getByRole("button", { name: "Move Write release notes down" });
      await down.click();
      await expect(order(page).nth(2)).toContainText("Write release notes");
      await expect(down).toBeFocused();
      await expect(status(page)).toHaveText("Write release notes moved to position 3 of 5.");
      await expect(order(page).nth(2)).toContainText("3");

      const up = page.getByRole("button", { name: "Move Fix the checkout bug up" });
      await expect(up).toHaveAttribute("aria-disabled", "true");
      await up.click({ force: true });
      await expect(status(page)).toHaveText("Fix the checkout bug is already first.");
    });

    test("dragging a handle moves the item", async ({ page }) => {
      await open(page, target.url("default"));
      const from = await handle(page, "Update dependencies").boundingBox();
      const to = await order(page).first().boundingBox();
      await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2);
      await page.mouse.down();
      await page.mouse.move(from!.x + from!.width / 2, to!.y + 4, { steps: 12 });
      await page.mouse.up();
      await expect(order(page).first()).toContainText("Update dependencies");
      await expect(status(page)).toHaveText("Update dependencies dropped at position 1 of 5.");
    });

    test("plain variant: no numbers and no move buttons", async ({ page }) => {
      await open(page, target.url("plain"));
      await expect(page.getByRole("button", { name: /^Move / })).toHaveCount(0);
      await expect(handle(page, "Write release notes")).toBeVisible();
    });
  });
}

test("registry serves the sortable list with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/sortable-list.json?moveButtons=false")).json();
  expect(item).toMatchObject({ name: "sortable-list", type: "registry:component" });
  expect(item.files[0].content).toContain('"moveButtons": false');
});
