import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { variants } from "./generate";

type Variant = keyof typeof variants;

// The same tests run against every exported output.
const targets = [
  { name: "React + Tailwind", url: (variant: Variant) => `/harness/date-picker-${variant}` },
  {
    name: "HTML/CSS/JS",
    url: (variant: Variant) => pathToFileURL(path.join(__dirname, ".generated/vanilla", variant, "index.html")).href,
  },
];

async function expectNoAxeViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
}

const field = (page: Page) => page.getByRole("textbox", { name: /^Date/ });
const focusedInDialog = (page: Page) => page.locator("dialog :focus");
const cell = (page: Page, name: string) => page.getByRole("gridcell", { name, exact: true });

for (const target of targets) {
  test.describe(`date picker — ${target.name} export`, () => {
    test.beforeEach(async ({ page }) => {
      await page.clock.setFixedTime(new Date(2026, 2, 10, 12)); // Tuesday 10 March 2026
    });

    test("no axe violations, closed and open, for every variant", async ({ page }) => {
      for (const variant of Object.keys(variants) as Variant[]) {
        await page.goto(target.url(variant));
        await expectNoAxeViolations(page);
        await page.getByRole("button", { name: /^Choose date/ }).click();
        await expect(page.getByRole("dialog")).toBeVisible();
        await expectNoAxeViolations(page);
      }
    });

    test("keyboard only: open, navigate, select, focus returns", async ({ page }) => {
      await page.goto(target.url("default"));
      await field(page).focus();
      await page.keyboard.press("Tab");
      const trigger = page.getByRole("button", { name: "Choose date" });
      await expect(trigger).toBeFocused();

      await page.keyboard.press("Enter");
      await expect(page.getByRole("dialog", { name: "Choose date" })).toBeVisible();
      await expect(focusedInDialog(page)).toHaveAccessibleName("Tuesday, March 10, 2026");
      await expect(focusedInDialog(page)).toHaveAttribute("aria-current", "date");

      for (const key of ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"]) await page.keyboard.press(key);
      await expect(focusedInDialog(page)).toHaveAccessibleName("Tuesday, March 10, 2026");

      await page.keyboard.press("ArrowDown"); // 17 March
      await page.keyboard.press("PageDown"); // 17 April
      await expect(page.getByRole("heading", { name: "April 2026" })).toBeVisible();
      await page.keyboard.press("Home"); // week starts Monday
      await expect(focusedInDialog(page)).toHaveAccessibleName("Monday, April 13, 2026");
      await page.keyboard.press("End");
      await expect(focusedInDialog(page)).toHaveAccessibleName("Sunday, April 19, 2026");
      await page.keyboard.press("Shift+PageUp");
      await expect(focusedInDialog(page)).toHaveAccessibleName("Saturday, April 19, 2025");

      await page.keyboard.press("Enter");
      await expect(page.getByRole("dialog")).toBeHidden();
      await expect(field(page)).toHaveValue("19/04/2025");
      await expect(trigger).toBeFocused();
    });

    test("Tab wraps inside the dialog; Escape closes without changing the value", async ({ page }) => {
      await page.goto(target.url("default"));
      await page.getByRole("button", { name: "Choose date" }).click();
      await expect(focusedInDialog(page)).toHaveAccessibleName("Tuesday, March 10, 2026");

      await page.keyboard.press("Tab"); // grid cell is last → wraps to first
      await expect(page.getByRole("button", { name: "Previous month" })).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: "Next month" })).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Shift+Tab"); // first → wraps to last
      await expect(focusedInDialog(page)).toHaveAccessibleName("Tuesday, March 10, 2026");

      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toBeHidden();
      await expect(field(page)).toHaveValue("");
      await expect(page.getByRole("button", { name: "Choose date" })).toBeFocused();
    });

    test("typed dates follow the format, with accurate errors", async ({ page }) => {
      await page.goto(target.url("default"));
      const input = field(page);
      const cases = [
        ["31/02/2026", "Day 31 doesn't exist — that month has 28 days."],
        ["10/13/2026", "13 isn't a valid month. Use 01 to 12."],
        ["2026-02-01", "Enter the date as DD/MM/YYYY."],
      ];
      for (const [typed, message] of cases) {
        await input.fill(typed);
        await input.press("Enter");
        await expect(input).toHaveAttribute("aria-invalid", "true");
        await expect(input).toHaveAccessibleDescription(message);
      }

      await input.fill("5/3/2026");
      await input.press("Enter");
      await expect(input).toHaveValue("05/03/2026");
      await expect(input).not.toHaveAttribute("aria-invalid");
      await expect(page.locator('main [role="alert"]')).toHaveText(""); // Next adds its own route-announcer alert
    });

    test("range variant: keyboard + mouse selection, add-ons, reversed input", async ({ page }) => {
      await page.goto(target.url("range"));
      const input = field(page);
      await expect(input).toHaveAccessibleDescription("Check-in to check-out");

      await page.getByRole("button", { name: "Choose dates" }).click();
      await page.keyboard.press("Home"); // week starts Sunday
      await expect(focusedInDialog(page)).toHaveAccessibleName("Sunday, March 8, 2026");
      await page.keyboard.press("Enter");
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByText("Now choose the end date.")).toBeVisible();
      for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight");
      await page.keyboard.press("Enter");
      await expect(page.getByRole("dialog")).toBeHidden();
      await expect(input).toHaveValue("2026-03-08 – 2026-03-11");

      await page.getByRole("button", { name: "Choose dates" }).click();
      await expect(cell(page, "Sunday, March 8, 2026")).toHaveAttribute("aria-selected", "true");
      await expect(cell(page, "Monday, March 9, 2026")).toHaveAttribute("aria-selected", "true");
      await expect(cell(page, "Wednesday, March 11, 2026")).toHaveAttribute("aria-selected", "true");
      await expect(cell(page, "Thursday, March 12, 2026")).toHaveAttribute("aria-selected", "false");

      // Picking the end before the start swaps them.
      await cell(page, "Friday, March 20, 2026").click();
      await cell(page, "Monday, March 16, 2026").click();
      await expect(input).toHaveValue("2026-03-16 – 2026-03-20");

      await page.getByRole("button", { name: "Choose dates" }).click();
      await page.keyboard.press("PageDown");
      await page.getByRole("button", { name: "Today" }).click();
      await expect(focusedInDialog(page)).toHaveAccessibleName("Tuesday, March 10, 2026");
      await page.keyboard.press("Escape");

      await input.fill("2026-03-20 – 2026-03-16");
      await input.press("Enter");
      await expect(input).toHaveAccessibleDescription("Check-in to check-out The end date is before the start date.");

      await page.getByRole("button", { name: "Clear dates" }).click();
      await expect(input).toHaveValue("");
      await expect(input).toBeFocused();
      await expect(input).not.toHaveAttribute("aria-invalid");
    });
  });
}

test("registry item carries the exact React export for the URL's config", async ({ request }) => {
  const response = await request.get(`/r/date-picker.json?${variants.range}`);
  expect(response.ok()).toBe(true);
  const item = await response.json();
  expect(item).toMatchObject({ name: "date-picker", type: "registry:component" });
  const exported = fs.readFileSync(path.join(process.cwd(), "app/harness/date-picker-range/date-picker.tsx"), "utf8");
  expect(item.files[0].content).toBe(exported);

  const invalid = await (await request.get("/r/date-picker.json?mode=sideways&accentColor=red&radius=999")).json();
  expect(invalid.files[0].content).toContain('"mode": "single"');
  expect(invalid.files[0].content).toContain('"accentColor": "#2563eb"');
  expect(invalid.files[0].content).toContain('"radius": 16');

  expect((await request.get("/r/nope.json")).status()).toBe(404);
});
