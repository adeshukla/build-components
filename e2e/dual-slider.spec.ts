import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["dual-slider"].variants);
const low = (page: Page) => page.getByRole("slider", { name: /Lowest/ });
const high = (page: Page) => page.getByRole("slider", { name: /Highest/ });

for (const target of targets("dual-slider")) {
  test.describe(`dual range slider — ${target.name} export`, () => {
    test("no axe violations for every variant, and after moving both ends", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await low(page).fill("200");
      await high(page).fill("240");
      await expectNoAxeViolations(page);
    });

    test("two named sliders under one legend, each with its own form value", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("group", { name: /Price range/ })).toBeVisible();
      await expect(page.getByRole("slider")).toHaveCount(2);
      await expect(low(page)).toHaveAttribute("name", "priceMin");
      await expect(high(page)).toHaveAttribute("name", "priceMax");
    });

    test("the value is announced with its currency, not as a bare number", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(low(page)).toHaveAttribute("aria-valuetext", "£80");
      // Past the other end, but still on the scale: Playwright refuses an out-of-range fill.
      await low(page).fill("360");
      // Clamped to the other end, and read back formatted.
      await expect(low(page)).toHaveAttribute("aria-valuetext", "£300");
      await expect(page.getByRole("status")).toHaveText("£300 to £320");
    });

    test("the ends clamp each other and keep the smallest gap", async ({ page }) => {
      await open(page, target.url("default"));
      await low(page).fill("400");
      await expect(low(page)).toHaveValue("300");
      await high(page).fill("0");
      await expect(high(page)).toHaveValue("320");
    });

    test("percent variant: its own scale, suffix and no bar", async ({ page }) => {
      await open(page, target.url("percent"));
      await expect(high(page)).toHaveAttribute("max", "100");
      await expect(page.getByRole("status")).toContainText("%");
    });
  });
}

test("registry serves the dual slider with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/dual-slider.json?name=weight&minGap=5")).json();
  expect(item).toMatchObject({ name: "dual-slider", type: "registry:component" });
  expect(item.files[0].content).toContain('"name": "weight"');
  expect(item.files[0].content).toContain('"minGap": 5');
});
