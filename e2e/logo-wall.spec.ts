import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["logo-wall"].variants);
const items = (page: Page) => page.getByRole("listitem");

for (const target of targets("logo-wall")) {
  test.describe(`logo wall — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("it is a named list of names", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("list", { name: "Built with" })).toBeVisible();
      await expect(items(page)).toHaveCount(6);
      await expect(items(page).first()).toHaveText("Next.js");
    });

    test("with no image, the name is text rather than a picture", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.locator("img")).toHaveCount(0);
      await expect(page.getByText("Tailwind CSS")).toBeVisible();
    });

    test("an image's alt is the name, not the word logo", async ({ page }) => {
      await open(page, target.url("pictured"));
      const image = page.locator("img").first();
      await expect(image).toHaveAttribute("alt", "Build Components");
      await expect(image).toHaveAttribute("loading", "lazy");
      await expect(page.getByRole("img", { name: /logo/i })).toHaveCount(0);
    });

    test("each entry is a comfortable target", async ({ page }) => {
      await open(page, target.url("default"));
      const box = await items(page).first().boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    });

    test("nothing claims anyone else's endorsement", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByText("only put a name there with their permission", { exact: false })).toBeVisible();
    });

    test("quiet variant: the heading is not part of the page outline", async ({ page }) => {
      await open(page, target.url("quiet"));
      await expect(page.getByRole("heading")).toHaveCount(0);
      await expect(page.getByText("Built with", { exact: true })).toBeVisible();
    });
  });
}

test("registry serves the logo wall with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/logo-wall.json?headingLevel=p&columns=6")).json();
  expect(item).toMatchObject({ name: "logo-wall", type: "registry:component" });
  expect(item.files[0].content).toContain('"headingLevel": "p"');
  expect(item.files[0].content).toContain('"columns": 6');
});
