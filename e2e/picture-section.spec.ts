import { expect, test } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["picture-section"].variants);

for (const target of targets("picture-section")) {
  test.describe(`picture — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("with no picture set, a drawn placeholder says what will be there, and nothing is loaded", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("img", { name: "The team planning the week around one shared board" })).toBeVisible();
      await expect(page.locator("img")).toHaveCount(0);
    });

    test("with one set: the picture, described, and its caption in a figure", async ({ page }) => {
      await open(page, target.url("picture"));
      await expect(page.locator("figure img")).toHaveAttribute("src", "/opengraph-image");
      await expect(page.locator("figcaption")).toHaveText("The board on a Monday morning");
    });
  });
}

test("a script address is never used as the picture", async ({ request }) => {
  const item = await (await request.get("/r/picture-section.json?imageSrc=javascript%3Aalert(1)")).json();
  expect(item.files[0].content).not.toContain("alert(1)");
  expect(item.files[0].content).toContain('"imageSrc": "#"');
  expect(item.files[0].content).toContain('if (value === "#") return "";');
});
