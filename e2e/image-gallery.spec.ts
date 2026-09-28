import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["image-gallery"].variants);
const figures = (page: Page) => page.locator("figure");

for (const target of targets("image-gallery")) {
  test.describe(`image gallery — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("it is a named list of figures", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("list", { name: "Workshop, September" })).toBeVisible();
      await expect(figures(page)).toHaveCount(4);
    });

    test("a described picture is an image with a name; a decorative one is hidden", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("img", { name: /stripped-down keyboards/ })).toBeVisible();
      // Two of the four are decoration, so only two are images to a reader.
      await expect(page.getByRole("img")).toHaveCount(2);
    });

    test("captions are separate from the descriptions", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.locator("figcaption")).toHaveCount(4);
      await expect(page.locator("figcaption").first()).toHaveText("Twelve keyboards, four working.");
    });

    test("the space is reserved before any file arrives", async ({ page }) => {
      await open(page, target.url("default"));
      const ratio = await figures(page).first().locator("div, img").first().evaluate((node) => getComputedStyle(node).aspectRatio);
      expect(ratio.replace(/\s/g, "")).toBe("4/3");
    });

    test("nothing pretends to be a photograph that is not there", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByText("[TODO: set src]").first()).toBeVisible();
      await expect(page.locator("img")).toHaveCount(0);
    });

    test("a real source becomes a lazily loaded img", async ({ page }) => {
      await open(page, target.url("sourced"));
      const image = page.locator("img").first();
      await expect(image).toHaveAttribute("loading", "lazy");
      await expect(image).toHaveAttribute("decoding", "async");
      await expect(image).toHaveAttribute("src", "/icon.svg");
    });

    test("nothing is focusable: it is pictures, not controls", async ({ page }) => {
      await open(page, target.url("default"));
      // Scoped to the component: the harness page around it is not what this claim is about.
      await expect(page.locator("ul").locator("a, button, [tabindex]")).toHaveCount(0);
    });

    test("square variant: its own shape and no captions", async ({ page }) => {
      await open(page, target.url("square"));
      await expect(page.locator("figcaption")).toHaveCount(0);
      const ratio = await figures(page).first().locator("div, img").first().evaluate((node) => getComputedStyle(node).aspectRatio);
      expect(ratio.replace(/\s/g, "")).toBe("1/1");
    });
  });
}

test("registry serves the image gallery with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/image-gallery.json?columns=3&aspect=1-1")).json();
  expect(item).toMatchObject({ name: "image-gallery", type: "registry:component" });
  expect(item.files[0].content).toContain('"columns": 3');
  expect(item.files[0].content).toContain('"aspect": "1-1"');
});
