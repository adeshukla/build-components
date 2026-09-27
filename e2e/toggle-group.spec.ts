import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["toggle-group"].variants);
// The checkbox is visually hidden inside the toggle, so a person clicks the label — and so does this.
const toggle = (page: Page, name: string) => page.getByText(name, { exact: true });
const box = (page: Page, name: string) => page.getByRole("checkbox", { name });

for (const target of targets("toggle-group")) {
  test.describe(`toggle group — ${target.name} export`, () => {
    test("no axe violations for every variant, empty and with some on", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await toggle(page, "Mon").click();
      await toggle(page, "Wed").click();
      await expectNoAxeViolations(page);
    });

    test("they are checkboxes under one legend, not buttons", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("group", { name: /Which days do you work/ })).toBeVisible();
      await expect(page.getByRole("checkbox")).toHaveCount(7);
      await expect(page.getByRole("button")).toHaveCount(0);
    });

    test("several can be on at once, and the status says which", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("status")).toHaveText("Nothing picked");
      await toggle(page, "Mon").click();
      await toggle(page, "Fri").click();
      await expect(box(page, "Mon")).toBeChecked();
      await expect(box(page, "Fri")).toBeChecked();
      await expect(page.getByRole("status")).toHaveText("2 picked: Mon, Fri");
    });

    test("the last one on refuses to turn off, and says so", async ({ page }) => {
      await open(page, target.url("default"));
      await toggle(page, "Tue").click();
      await expect(box(page, "Tue")).toHaveAttribute("aria-disabled", "true");
      // Playwright will not click an aria-disabled control, which is exactly what this is: force it
      // the way a determined person would and check it stays on.
      await toggle(page, "Tue").click({ force: true });
      await expect(box(page, "Tue")).toBeChecked();
      // With a second one on, the first can go off again.
      await toggle(page, "Thu").click();
      await expect(box(page, "Tue")).not.toHaveAttribute("aria-disabled", "true");
      await toggle(page, "Tue").click();
      await expect(box(page, "Tue")).not.toBeChecked();
    });

    test("loose variant: the last one can be turned off", async ({ page }) => {
      await open(page, target.url("loose"));
      await toggle(page, "Mon").click();
      await expect(box(page, "Mon")).toBeChecked();
      await toggle(page, "Mon").click();
      await expect(box(page, "Mon")).not.toBeChecked();
    });
  });
}

test("registry serves the toggle group with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/toggle-group.json?name=weekdays&minOne=false")).json();
  expect(item).toMatchObject({ name: "toggle-group", type: "registry:component" });
  expect(item.files[0].content).toContain('"name": "weekdays"');
  expect(item.files[0].content).toContain('"minOne": false');
});
