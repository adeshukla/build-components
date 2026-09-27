import { expect, test } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["hero"].variants);

for (const target of targets("hero")) {
  test.describe(`hero — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("the line above the heading is not a heading", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("heading")).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Get your boat ready before the season starts");
      await expect(page.getByText("Refit yard, Falmouth")).toBeVisible();
    });

    test("both actions are links, and the section is labelled by its heading", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("link", { name: "Ask for a quote" })).toHaveAttribute("href", "/quote");
      await expect(page.getByRole("link", { name: "See the yard" })).toHaveAttribute("href", "/yard");
      await expect(page.getByRole("region", { name: /Get your boat ready/ })).toBeVisible();
    });

    test("the picture panel describes what will go there", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("img", { name: "Photograph of the yard goes here" })).toBeVisible();
      // Drawn, not loaded: nothing is requested for it.
      await expect(page.locator("img")).toHaveCount(0);
    });

    test("centred variant: heading drops to level two and the panel goes", async ({ page }) => {
      await open(page, target.url("centred"));
      await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);
      await expect(page.getByRole("img")).toHaveCount(0);
    });
  });
}

test("registry serves the hero with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/hero.json?headingLevel=h2&align=centre")).json();
  expect(item).toMatchObject({ name: "hero", type: "registry:component" });
  expect(item.files[0].content).toContain('"headingLevel": "h2"');
  expect(item.files[0].content).toContain('"align": "centre"');
});
