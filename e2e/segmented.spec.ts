import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.segmented.variants);
const choice = (page: Page, name: string) => page.getByRole("radio", { name, exact: true });

for (const target of targets("segmented") ) {
  test.describe(`segmented control — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("one group, one Tab stop, arrow keys pick", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("group", { name: "View" })).toBeVisible();
      await expect(choice(page, "List")).toBeChecked();
      await page.keyboard.press("Tab");
      await expect(choice(page, "List")).toBeFocused();
      await page.keyboard.press("ArrowRight");
      await expect(choice(page, "Board")).toBeChecked();
      await page.keyboard.press("ArrowRight");
      await expect(choice(page, "Calendar")).toBeChecked();
    });

    test("wide variant: the label is still read, just not shown", async ({ page }) => {
      await open(page, target.url("wide"));
      await expect(page.getByRole("group", { name: "View" })).toBeVisible();
      await expect(choice(page, "List")).toBeChecked();
    });
  });
}

test("registry serves the segmented control with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/segmented.json?fullWidth=true&startIndex=9")).json();
  expect(item).toMatchObject({ name: "segmented", type: "registry:component" });
  expect(item.files[0].content).toContain('"fullWidth": true');
  expect(item.files[0].content).toContain('"startIndex": 5'); // clamped to the schema maximum
});
