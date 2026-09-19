import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.accordion.variants);
const section = (page: Page, name: string | RegExp) => page.getByRole("button", { name });

for (const target of targets("accordion")) {
  test.describe(`accordion — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
        await page.getByRole("button").first().click();
        await expectNoAxeViolations(page);
      }
    });

    test("the first section starts open, and its text is in the page", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(section(page, /^How do I install/)).toHaveAttribute("aria-expanded", "true");
      await expect(page.getByText(/Copy the file, or run the one install command/)).toBeVisible();
      await expect(page.getByText(/No\. Every part is plain React/)).toBeHidden();
    });

    test("opening one section closes the last one", async ({ page }) => {
      await open(page, target.url("default"));
      await section(page, /^Do I need a library/).click();
      await expect(section(page, /^Do I need a library/)).toHaveAttribute("aria-expanded", "true");
      await expect(section(page, /^How do I install/)).toHaveAttribute("aria-expanded", "false");
      await expect(page.getByText(/Copy the file, or run the one install command/)).toBeHidden();
    });

    test("each button sits inside a heading, and names its own panel", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("heading", { level: 3, name: /^How do I install/ })).toBeVisible();
      await expect(page.getByRole("region", { name: /^How do I install/ })).toBeVisible();
    });

    test("cards variant: several open at once, and none open to start", async ({ page }) => {
      await open(page, target.url("cards"));
      await expect(page.getByRole("heading", { level: 2, name: /^How do I install/ })).toBeVisible();
      await expect(section(page, /^How do I install/)).toHaveAttribute("aria-expanded", "false");

      await section(page, /^How do I install/).click();
      await section(page, /^Do I need a library/).click();
      await expect(section(page, /^How do I install/)).toHaveAttribute("aria-expanded", "true");
      await expect(section(page, /^Do I need a library/)).toHaveAttribute("aria-expanded", "true");
    });
  });
}

test("registry serves the accordion with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/accordion.json?headingLevel=h9&icon=plus&radius=999")).json();
  expect(item).toMatchObject({ name: "accordion", type: "registry:component" });
  expect(item.files[0].content).toContain('"icon": "plus"');
  expect(item.files[0].content).toContain('"headingLevel": "h3"'); // unknown value falls back
  expect(item.files[0].content).toContain('"radius": 24'); // clamped to the schema maximum
});
