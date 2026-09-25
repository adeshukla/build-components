import { expect, test } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["avatar-group"].variants);

for (const target of targets("avatar-group")) {
  test.describe(`avatar group — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("full names, never initials, and the rest are named too", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("list", { name: "On this project" })).toBeVisible();
      await expect(page.getByRole("img", { name: "Ada Okafor" })).toBeVisible();
      await expect(page.getByRole("img", { name: "1 more: Elin Marsh" })).toBeVisible();
      await expect(page.getByRole("listitem")).toHaveCount(5);
    });

    test("the same name always gets the same colour", async ({ page }) => {
      await open(page, target.url("default"));
      const colours = await page
        .getByRole("img", { name: "Ada Okafor" })
        .evaluate((node) => getComputedStyle(node).backgroundColor);
      await open(page, target.url("default"));
      await expect(page.getByRole("img", { name: "Ada Okafor" })).toHaveCSS("background-color", colours);
    });

    test("large variant: three shown, two counted", async ({ page }) => {
      await open(page, target.url("large"));
      await expect(page.getByRole("img", { name: "2 more: Dara Whitfield, Elin Marsh" })).toBeVisible();
    });
  });
}

test("registry serves the avatar group with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/avatar-group.json?size=lg&max=99")).json();
  expect(item).toMatchObject({ name: "avatar-group", type: "registry:component" });
  expect(item.files[0].content).toContain('"size": "lg"');
  expect(item.files[0].content).toContain('"max": 8'); // clamped to the schema maximum
});
