import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.lightbox.variants);
const viewer = (page: Page) => page.getByRole("dialog", { name: "Gallery, picture viewer" });
const thumb = (page: Page, name: string) => page.getByRole("button", { name });

for (const target of targets("lightbox")) {
  test.describe(`lightbox — ${target.name} export`, () => {
    test("no axe violations for every variant, grid and viewer", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
        await thumb(page, "Harbour at dawn").click();
        await expect(viewer(page)).toBeVisible();
        await expectNoAxeViolations(page);
      }
    });

    test("a thumbnail opens the viewer on Close, with its position and caption", async ({ page }) => {
      await open(page, target.url("default"));
      await thumb(page, "Lighthouse on the cliff").click();
      await expect(page.getByRole("button", { name: "Close" })).toBeFocused();
      await expect(viewer(page).getByText("3 of 6")).toBeVisible();
      await expect(viewer(page).getByRole("img", { name: "Lighthouse on the cliff" })).toBeVisible();
      await expect(viewer(page).getByText("The lighthouse on the north cliff.")).toBeVisible();
    });

    test("arrow keys, Home and End move; it loops", async ({ page }) => {
      await open(page, target.url("default"));
      await thumb(page, "Harbour at dawn").click();
      await page.keyboard.press("ArrowRight");
      await expect(viewer(page).getByText("2 of 6")).toBeVisible();
      await page.keyboard.press("End");
      await expect(viewer(page).getByText("6 of 6")).toBeVisible();
      await page.keyboard.press("ArrowRight");
      await expect(viewer(page).getByText("1 of 6")).toBeVisible();
      await page.keyboard.press("ArrowLeft");
      await expect(viewer(page).getByRole("img", { name: "Evening on the beach" })).toBeVisible();
    });

    test("Escape returns focus to the thumbnail of the picture you were on", async ({ page }) => {
      await open(page, target.url("default"));
      await thumb(page, "Harbour at dawn").click();
      await page.getByRole("button", { name: "Next picture" }).click();
      await page.getByRole("button", { name: "Next picture" }).click();
      await page.keyboard.press("Escape");
      await expect(viewer(page)).toBeHidden();
      await expect(thumb(page, "Lighthouse on the cliff")).toBeFocused();
    });

    test("Tab stays inside the viewer", async ({ page }) => {
      await open(page, target.url("default"));
      await thumb(page, "Harbour at dawn").click();
      for (let i = 0; i < 3; i++) await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: "Close" })).toBeFocused();
    });

    test("no-loop variant: the ends say so, and captions are off", async ({ page }) => {
      await open(page, target.url("noloop"));
      await thumb(page, "Harbour at dawn").click();
      await expect(page.getByRole("button", { name: "Previous picture" })).toHaveAttribute("aria-disabled", "true");
      await page.keyboard.press("ArrowLeft");
      await expect(viewer(page).getByText("1 of 6")).toBeVisible();
      await expect(viewer(page).getByText("The harbour just after sunrise.")).toHaveCount(0);
    });
  });
}

test("registry serves the lightbox with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/lightbox.json?columns=9&loop=false")).json();
  expect(item).toMatchObject({ name: "lightbox", type: "registry:component" });
  expect(item.files[0].content).toContain('"columns": "3"'); // unknown value falls back
  expect(item.files[0].content).toContain('"loop": false');
});
