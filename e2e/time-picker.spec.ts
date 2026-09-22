import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["time-picker"].variants);
const field = (page: Page, name = "Start time") => page.getByRole("combobox", { name });
const hidden = (page: Page) => page.locator('input[type="hidden"][name="start-time"]');

for (const target of targets("time-picker")) {
  test.describe(`time picker — ${target.name} export`, () => {
    test("no axe violations for every variant, closed and open", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
        await page.getByRole("combobox").focus();
        await page.keyboard.press("ArrowDown");
        await expect(page.getByRole("listbox")).toBeVisible();
        await expectNoAxeViolations(page);
      }
    });

    test("the arrow keys open the list and move through it; Enter picks", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page).focus();
      await page.keyboard.press("ArrowDown"); // opens
      await expect(field(page)).toHaveAttribute("aria-expanded", "true");
      await page.keyboard.press("ArrowDown"); // 08:00
      await page.keyboard.press("ArrowDown"); // 08:30
      await expect(page.getByRole("option", { name: "08:30" })).toHaveAttribute("id", /.+/);
      await page.keyboard.press("Enter");
      await expect(field(page)).toHaveValue("08:30");
      await expect(field(page)).toHaveAttribute("aria-expanded", "false");
      await expect(hidden(page)).toHaveValue("08:30");
    });

    test("typing filters the list, and Enter takes the first match", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page).fill("14");
      await expect(page.getByRole("option")).toHaveText(["14:00", "14:30"]);
      await page.keyboard.press("Enter");
      await expect(field(page)).toHaveValue("14:00");
    });

    test("a typed time between the listed ones is kept", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page).fill("947");
      await page.keyboard.press("Tab");
      await expect(field(page)).toHaveValue("09:47");
      await expect(hidden(page)).toHaveValue("09:47");
    });

    test("times outside the allowed hours, or not times at all, are explained", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page).fill("19:00");
      await page.keyboard.press("Tab");
      await expect(page.getByRole("alert").filter({ hasText: "between" })).toHaveText("Choose a time between 08:00 and 18:00.");
      await expect(field(page)).toHaveAttribute("aria-invalid", "true");
      await expect(hidden(page)).toHaveValue("");

      await field(page).fill("lunch");
      await page.keyboard.press("Tab");
      await expect(page.getByText("Enter a time like 14:30.")).toBeVisible();
    });

    test("12-hour variant: opens on the chosen time and reads am/pm", async ({ page }) => {
      await open(page, target.url("twelve"));
      const pickup = field(page, "Pickup time");
      await expect(pickup).toHaveValue("9:30 am");
      await pickup.focus();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByRole("option", { name: "9:30 am" })).toHaveAttribute("aria-selected", "true");
      await expect(pickup).toHaveAttribute("aria-activedescendant", /option/);
      await pickup.fill("2pm");
      await page.keyboard.press("Tab");
      await expect(pickup).toHaveValue("2:00 pm");
    });
  });
}

test("registry serves the time picker with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/time-picker.json?format=12h&interval=7")).json();
  expect(item).toMatchObject({ name: "time-picker", type: "registry:component" });
  expect(item.files[0].content).toContain('"format": "12h"');
  expect(item.files[0].content).toContain('"interval": "30"'); // unknown value falls back
});
