import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["kanban"].variants);
const column = (page: Page, name: string) => page.getByRole("region", { name: new RegExp(name) });

for (const target of targets("kanban")) {
  test.describe(`kanban — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("a card moves with the keyboard, focus follows it and the move is announced", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(column(page, "To do")).toContainText("Sand the deck");
      await page.getByRole("button", { name: "Move Sand the deck to In progress" }).click();
      await expect(column(page, "In progress")).toContainText("Sand the deck");
      await expect(column(page, "To do")).not.toContainText("Sand the deck");
      await expect(page.getByRole("status")).toContainText("Sand the deck moved to In progress");
      // The button that was pressed belongs to the old column: focus has to land on the card's new one.
      await expect(page.getByRole("button", { name: /Move Sand the deck to/ }).first()).toBeFocused();
    });

    test("the end columns have no move button past the end", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("button", { name: /Move Order sailcloth to/ })).toHaveCount(1);
      await expect(page.getByRole("button", { name: /Move Paint the hull to/ })).toHaveCount(1);
      await expect(page.getByRole("button", { name: /Move Rewire the cabin to/ })).toHaveCount(2);
    });

    test("the counts follow the cards", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(column(page, "To do")).toHaveAccessibleName("To do (2)");
      await page.getByRole("button", { name: "Move Sand the deck to In progress" }).click();
      await expect(column(page, "To do")).toHaveAccessibleName("To do (1)");
      await expect(column(page, "In progress")).toHaveAccessibleName("In progress (3)");
    });

    test("quiet variant: no counts and nothing draggable", async ({ page }) => {
      await open(page, target.url("quiet"));
      await expect(column(page, "To do")).toHaveAccessibleName("To do");
      await expect(page.locator("[draggable=true]")).toHaveCount(0);
      await page.getByRole("button", { name: "Move Sand the deck to In progress" }).click();
      await expect(column(page, "In progress")).toContainText("Sand the deck");
    });
  });
}

test("registry serves the kanban board with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/kanban.json?label=Sprint&allowDrag=false")).json();
  expect(item).toMatchObject({ name: "kanban", type: "registry:component" });
  expect(item.files[0].content).toContain('"label": "Sprint"');
  expect(item.files[0].content).toContain('"allowDrag": false');
});
