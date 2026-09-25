import { expect, test } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["empty-state"].variants);

for (const target of targets("empty-state")) {
  test.describe(`empty state — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("a heading, a way forward, and no decoration in the reading order", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("heading", { name: "No results for that search", level: 2 })).toBeVisible();
      await expect(page.getByRole("link", { name: "Clear filters" })).toHaveAttribute("href", "/search");
      await expect(page.getByRole("link", { name: "Browse everything" })).toBeVisible();
      await expect(page.getByRole("img")).toHaveCount(0);
    });

    test("inbox variant: left aligned, no actions", async ({ page }) => {
      await open(page, target.url("inbox"));
      await expect(page.getByRole("heading", { name: "No messages yet" })).toBeVisible();
      await expect(page.getByRole("link")).toHaveCount(0);
    });
  });
}

test("registry serves the empty state with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/empty-state.json?icon=inbox&headingLevel=h9")).json();
  expect(item).toMatchObject({ name: "empty-state", type: "registry:component" });
  expect(item.files[0].content).toContain('"icon": "inbox"');
  expect(item.files[0].content).toContain('"headingLevel": "h2"'); // unknown value falls back
});
