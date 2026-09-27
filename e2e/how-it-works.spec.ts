import { expect, test } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["how-it-works"].variants);

for (const target of targets("how-it-works")) {
  test.describe(`how it works — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("the order is in the markup, not only in the circles", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.locator("ol")).toHaveCount(1);
      await expect(page.getByRole("listitem")).toHaveCount(4);
      await expect(page.getByRole("heading", { level: 3 }).first()).toHaveText("Tell us what it needs");
    });

    test("the numbers and the connecting line are decoration", async ({ page }) => {
      await open(page, target.url("default"));
      const hidden = page.locator("li [aria-hidden=true]");
      expect(await hidden.count()).toBeGreaterThanOrEqual(4);
      await expect(page.getByRole("listitem").first()).toContainText("10 minutes");
    });

    test("the section is a landmark named by its heading", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("region", { name: "How a refit works" })).toBeVisible();
    });

    test("down variant: renamed heading, still four steps", async ({ page }) => {
      await open(page, target.url("down"));
      await expect(page.getByRole("region", { name: "From quote to launch" })).toBeVisible();
      await expect(page.getByRole("listitem")).toHaveCount(4);
    });
  });
}

test("registry serves how it works with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/how-it-works.json?layout=down&showNumbers=false")).json();
  expect(item).toMatchObject({ name: "how-it-works", type: "registry:component" });
  expect(item.files[0].content).toContain('"layout": "down"');
  expect(item.files[0].content).toContain('"showNumbers": false');
});
