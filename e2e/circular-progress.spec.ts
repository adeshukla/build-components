import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["circular-progress"].variants);
const ring = (page: Page) => page.getByRole("progressbar");
const run = (page: Page) => page.getByRole("button");

for (const target of targets("circular-progress")) {
  test.describe(`circular progress — ${target.name} export`, () => {
    test("no axe violations for every variant, and part way through", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("part-way"));
      await expectNoAxeViolations(page);
    });

    test("it is a named progressbar, not an unlabelled one", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(ring(page)).toHaveAccessibleName("Uploading photos");
    });

    test("the value is read back with its unit, not as a bare number", async ({ page }) => {
      await open(page, target.url("part-way"));
      await expect(ring(page)).toHaveAttribute("aria-valuenow", "62");
      await expect(ring(page)).toHaveAttribute("aria-valuetext", "62% uploaded");
      await expect(ring(page)).toHaveAttribute("aria-valuemin", "0");
      await expect(ring(page)).toHaveAttribute("aria-valuemax", "100");
    });

    test("the number is on the face as well as in the value", async ({ page }) => {
      await open(page, target.url("part-way"));
      await expect(page.locator("[data-face]")).toHaveText("62%");
      await expect(page.locator("[data-face]")).toHaveAttribute("aria-hidden", "true");
    });

    test("running it reaches 100 and announces only the end", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("status")).toHaveText("");
      await run(page).click();
      await expect(ring(page)).toHaveAttribute("aria-valuenow", "100", { timeout: 8_000 });
      await expect(page.getByRole("status")).toHaveText("All photos uploaded.");
    });

    test("the ring is a readout, not a control", async ({ page }) => {
      await open(page, target.url("part-way"));
      await expect(ring(page)).not.toHaveAttribute("tabindex", "0");
    });

    test("indeterminate carries no value at all", async ({ page }) => {
      await open(page, target.url("indeterminate"));
      await expect(ring(page)).toHaveAttribute("aria-busy", "true");
      await expect(ring(page)).not.toHaveAttribute("aria-valuenow", /.*/);
      await expect(page.getByText("Working. This can take a minute.")).toBeVisible();
      // Nothing to start, because nothing is being counted.
      await expect(run(page)).toHaveCount(0);
    });
  });
}

test("registry serves the circular progress with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/circular-progress.json?mode=indeterminate&size=64")).json();
  expect(item).toMatchObject({ name: "circular-progress", type: "registry:component" });
  expect(item.files[0].content).toContain('"mode": "indeterminate"');
  expect(item.files[0].content).toContain('"size": 64');
});
