import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["product-card"].variants);
const add = (page: Page) => page.getByRole("button", { name: /Add to (bag|basket)/ });
// The radios are visually hidden, so a person clicks the label — and so does this.
const pick = (page: Page, name: string) => page.getByText(name, { exact: true }).click();

for (const target of targets("product-card")) {
  test.describe(`product card — ${target.name} export`, () => {
    test("no axe violations for every variant, before and after choosing", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await pick(page, "Navy");
      await pick(page, "M");
      await expectNoAxeViolations(page);
    });

    test("options are grouped radios, and out of stock is said in words", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("group", { name: "Colour" })).toBeVisible();
      await expect(page.getByRole("group", { name: "Size" })).toBeVisible();
      await expect(page.getByRole("radio", { name: /Moss/ })).toBeDisabled();
      await expect(page.getByRole("radio", { name: /Moss/ })).toHaveAccessibleName(/out of stock/);
    });

    test("Add waits for a pick in every group and says which is missing", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(add(page)).toBeDisabled();
      await expect(page.getByRole("status")).toHaveText("Pick a colour and a size first");
      await pick(page, "Navy");
      await expect(page.getByRole("status")).toHaveText("Pick a size first");
      await expect(add(page)).toBeDisabled();
      await pick(page, "M");
      await expect(add(page)).toBeEnabled();
      await expect(page.getByRole("status")).toHaveText("");
    });

    test("adding says what went in, options and all", async ({ page }) => {
      await open(page, target.url("default"));
      await pick(page, "Sand");
      await pick(page, "L");
      await add(page).click();
      await expect(page.getByRole("status")).toHaveText("Deck jacket added: Sand, L");
    });

    test("plain variant: no price, renamed button", async ({ page }) => {
      await open(page, target.url("plain"));
      await expect(page.getByText("£128")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Add to basket" })).toBeVisible();
    });
  });
}

test("registry serves the product card with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/product-card.json?name=Storm+cap&showPrice=false")).json();
  expect(item).toMatchObject({ name: "product-card", type: "registry:component" });
  expect(item.files[0].content).toContain('"name": "Storm cap"');
  expect(item.files[0].content).toContain('"showPrice": false');
});
