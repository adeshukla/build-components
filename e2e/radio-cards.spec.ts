import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["radio-cards"].variants);
// The radio is visually hidden inside the card, so a person clicks the card — and so does this.
const card = (page: Page, name: string) => page.getByText(name, { exact: true });
const radio = (page: Page, name: string) => page.getByRole("radio", { name: new RegExp(name) });

for (const target of targets("radio-cards")) {
  test.describe(`radio cards — ${target.name} export`, () => {
    test("no axe violations for every variant, before and after picking", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await card(page, "Express").click();
      await expectNoAxeViolations(page);
    });

    test("the cards are one radio group under one question", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("group", { name: /How should we deliver it/ })).toBeVisible();
      await expect(page.getByRole("radio")).toHaveCount(4);
    });

    test("picking a card says which one, and only one can be on", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("status")).toHaveText("Nothing picked yet");
      await card(page, "Standard").click();
      await expect(radio(page, "Standard")).toBeChecked();
      await expect(page.getByRole("status")).toHaveText("Standard picked");
      await card(page, "Saturday").click();
      await expect(radio(page, "Standard")).not.toBeChecked();
      await expect(page.getByRole("status")).toHaveText("Saturday picked");
    });

    test("an option that is off cannot be picked and says so", async ({ page }) => {
      await open(page, target.url("default"));
      const off = radio(page, "Collect in person");
      await expect(off).toBeDisabled();
      await expect(off).toHaveAccessibleName(/Not available/);
    });

    test("the arrow keys move between the cards", async ({ page }) => {
      await open(page, target.url("default"));
      // Focused rather than clicked: Safari does not focus a radio when its label is clicked.
      await radio(page, "Standard").focus();
      await page.keyboard.press("ArrowDown");
      await expect(radio(page, "Express")).toBeChecked();
    });

    test("list variant: one column and no tick", async ({ page }) => {
      await open(page, target.url("list"));
      await expect(page.getByRole("group", { name: /Pick a plan/ })).toBeVisible();
      await card(page, "Express").click();
      await expect(page.getByText("✓")).toHaveCount(0);
    });
  });
}

test("registry serves the radio cards with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/radio-cards.json?name=shipping&columns=three")).json();
  expect(item).toMatchObject({ name: "radio-cards", type: "registry:component" });
  expect(item.files[0].content).toContain('"name": "shipping"');
  expect(item.files[0].content).toContain('"columns": "three"');
});
