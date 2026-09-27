import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["command-menu"].variants);
const trigger = (page: Page) => page.getByRole("button", { name: /Commands|Actions/ });
const field = (page: Page) => page.getByRole("combobox");
const options = (page: Page) => page.getByRole("option");
const active = (page: Page) => page.locator('[role=option][aria-selected="true"]');

async function openMenu(page: Page) {
  await trigger(page).click();
  await expect(field(page)).toBeFocused();
}

for (const target of targets("command-menu")) {
  test.describe(`command menu — ${target.name} export`, () => {
    test("no axe violations for every variant, closed, open and with no hits", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await openMenu(page);
      await expectNoAxeViolations(page);
      await field(page).fill("zzzz");
      await expectNoAxeViolations(page);
    });

    test("it is a combobox over a listbox, and the field keeps the focus", async ({ page }) => {
      await open(page, target.url("default"));
      await openMenu(page);
      await expect(page.getByRole("listbox")).toBeVisible();
      await expect(options(page)).toHaveCount(7);
      await page.keyboard.press("ArrowDown");
      // The focus never leaves the field: what moves is aria-activedescendant.
      await expect(field(page)).toBeFocused();
      const id = await active(page).getAttribute("id");
      await expect(field(page)).toHaveAttribute("aria-activedescendant", id ?? "");
    });

    test("the groups are announced but are not extra stops", async ({ page }) => {
      await open(page, target.url("default"));
      await openMenu(page);
      const groups = page.getByRole("listbox").getByRole("group");
      await expect(groups).toHaveCount(3);
      await expect(groups.first()).toHaveAccessibleName("This page");
    });

    test("every word has to match, in any order", async ({ page }) => {
      await open(page, target.url("default"));
      await openMenu(page);
      await field(page).fill("copy react");
      await expect(options(page)).toHaveCount(1);
      await expect(options(page).first()).toContainText("Copy the React file");
      await field(page).fill("go");
      await expect(options(page)).toHaveCount(2);
    });

    test("arrows walk one flat list across the group headings", async ({ page }) => {
      await open(page, target.url("default"));
      await openMenu(page);
      await expect(active(page)).toContainText("Copy the React file");
      for (let step = 0; step < 3; step++) await page.keyboard.press("ArrowDown");
      // Three down from the first row is the first row of the second group.
      await expect(active(page)).toContainText("Parts catalogue");
      await page.keyboard.press("End");
      await expect(active(page)).toContainText("Follow the device");
      await page.keyboard.press("Home");
      await expect(active(page)).toContainText("Copy the React file");
    });

    test("only one row is ever active", async ({ page }) => {
      await open(page, target.url("default"));
      await openMenu(page);
      await page.keyboard.press("ArrowDown");
      await expect(active(page)).toHaveCount(1);
    });

    test("Enter runs the highlighted command, says which, and closes", async ({ page }) => {
      await open(page, target.url("default"));
      await openMenu(page);
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      await expect(page.getByRole("listbox")).toBeHidden();
      await expect(page.getByRole("status").filter({ hasText: "Ran:" })).toContainText("Copy the install command");
      await expect(trigger(page)).toBeFocused();
    });

    test("Escape closes it and gives focus back to the button", async ({ page }) => {
      await open(page, target.url("default"));
      await openMenu(page);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("listbox")).toBeHidden();
      await expect(trigger(page)).toBeFocused();
    });

    test("the keyboard shortcut opens it from anywhere on the page", async ({ page }) => {
      await open(page, target.url("default"));
      await page.keyboard.press("ControlOrMeta+k");
      await expect(field(page)).toBeFocused();
      await page.keyboard.press("ControlOrMeta+k");
      await expect(page.getByRole("listbox")).toBeHidden();
    });

    test("nothing matching says so instead of showing an empty box", async ({ page }) => {
      await open(page, target.url("default"));
      await openMenu(page);
      await field(page).fill("zzzz");
      await expect(options(page)).toHaveCount(0);
      await expect(page.getByText("No command matches that.")).toBeVisible();
      await expect(field(page)).toHaveAttribute("aria-expanded", "false");
    });

    test("bare variant: no shortcut hints and its own wording", async ({ page }) => {
      await open(page, target.url("bare"));
      await expect(page.getByRole("button", { name: "Actions" })).toBeVisible();
      await page.getByRole("button", { name: "Actions" }).click();
      await expect(page.locator("kbd")).toHaveCount(0);
    });
  });
}

test("registry serves the command menu with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/command-menu.json?triggerLabel=Actions&showShortcuts=false")).json();
  expect(item).toMatchObject({ name: "command-menu", type: "registry:component" });
  expect(item.files[0].content).toContain('"triggerLabel": "Actions"');
  expect(item.files[0].content).toContain('"showShortcuts": false');
});
