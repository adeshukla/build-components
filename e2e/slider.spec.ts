import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.slider.variants);
const lowest = (page: Page) => page.getByRole("slider", { name: "Budget, lowest" });
const highest = (page: Page) => page.getByRole("slider", { name: "Budget, highest" });

for (const target of targets("slider")) {
  test.describe(`range slider — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("each end is its own slider, named and valued with its unit", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(lowest(page)).toHaveValue("40");
      await expect(highest(page)).toHaveValue("140");
      await expect(lowest(page)).toHaveAttribute("aria-valuetext", "£40");
      await expect(page.getByText("£40 – £140")).toBeVisible();
    });

    test("the arrow keys move an end by one step, and the text follows", async ({ page }) => {
      await open(page, target.url("default"));
      await lowest(page).focus();
      await page.keyboard.press("ArrowRight");
      await expect(lowest(page)).toHaveValue("50");
      await expect(lowest(page)).toHaveAttribute("aria-valuetext", "£50");
      await expect(page.getByText("£50 – £140")).toBeVisible();
    });

    test("the two ends cannot cross", async ({ page }) => {
      await open(page, target.url("default"));
      await lowest(page).focus();
      await page.keyboard.press("End"); // tries to jump to 200
      await expect(lowest(page)).toHaveValue("140"); // stops at the highest end

      await highest(page).focus();
      await page.keyboard.press("Home"); // tries to jump to 0
      await expect(highest(page)).toHaveValue("140"); // stops at the lowest end
    });

    test("single variant: one slider, with its unit", async ({ page }) => {
      await open(page, target.url("single"));
      const volume = page.getByRole("slider", { name: "Volume" });
      await expect(volume).toHaveValue("30");
      await volume.focus();
      await page.keyboard.press("ArrowUp");
      await expect(volume).toHaveValue("35");
      await expect(volume).toHaveAttribute("aria-valuetext", "35%");
      await expect(page.getByText("35%").first()).toBeVisible();
    });
  });
}

test("registry serves the slider with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/slider.json?mode=dial&step=999&prefix=%24")).json();
  expect(item).toMatchObject({ name: "slider", type: "registry:component" });
  expect(item.files[0].content).toContain('"prefix": "$"');
  expect(item.files[0].content).toContain('"step": 100'); // clamped to the schema maximum
  expect(item.files[0].content).toContain('"mode": "range"'); // unknown value falls back
});
