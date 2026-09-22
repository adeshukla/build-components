import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["card-fields"].variants);
const field = (page: Page, name: string) => page.getByRole("textbox", { name, exact: true });
const pay = (page: Page) => page.getByRole("button", { name: /^Pay/ });

for (const target of targets("card-fields")) {
  test.describe(`card fields — ${target.name} export`, () => {
    test("no axe violations for every variant, empty and with every error", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
        await pay(page).click();
        await expectNoAxeViolations(page);
      }
    });

    test("fields carry autocomplete and a number keypad", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(field(page, "Card number")).toHaveAttribute("autocomplete", "cc-number");
      await expect(field(page, "Card number")).toHaveAttribute("inputmode", "numeric");
      await expect(field(page, "Expiry date")).toHaveAttribute("autocomplete", "cc-exp");
      await expect(field(page, "Security code")).toHaveAttribute("autocomplete", "cc-csc");
      await expect(field(page, "Name on card")).toHaveAttribute("autocomplete", "cc-name");
    });

    test("the number groups as you type and names the card type", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page, "Card number").pressSequentially("4242424242424242");
      await expect(field(page, "Card number")).toHaveValue("4242 4242 4242 4242");
      await expect(page.getByText("Visa", { exact: true })).toBeVisible();

      await field(page, "Card number").fill("");
      await field(page, "Card number").pressSequentially("378282246310005");
      await expect(field(page, "Card number")).toHaveValue("3782 822463 10005");
      await expect(page.getByText("4 digits on the front")).toBeVisible();
    });

    test("the expiry gets its slash, and a past date is refused", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page, "Expiry date").pressSequentially("0120");
      await expect(field(page, "Expiry date")).toHaveValue("01/20");
      await page.keyboard.press("Tab");
      await expect(page.getByText("This card has expired.")).toBeVisible();
      await expect(field(page, "Expiry date")).toHaveAttribute("aria-invalid", "true");
    });

    test("a typo in the number fails the checksum", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page, "Card number").pressSequentially("4242424242424241");
      await page.keyboard.press("Tab");
      await expect(page.getByText("Enter a valid card number. Check for a typo.")).toBeVisible();
      await expect(field(page, "Card number")).toHaveAccessibleDescription(/Error: Enter a valid card number/);
    });

    test("submitting with gaps focuses the first; a complete card passes", async ({ page }) => {
      await open(page, target.url("default"));
      await pay(page).click();
      await expect(field(page, "Name on card")).toBeFocused();
      await expect(page.getByText("Enter the name on the card.")).toBeVisible();

      await field(page, "Name on card").fill("Ada Lovelace");
      await field(page, "Card number").pressSequentially("4242424242424242");
      await field(page, "Expiry date").pressSequentially("1239");
      await field(page, "Security code").pressSequentially("123");
      await field(page, "Postcode").fill("SW1A 1AA");
      await pay(page).click();
      await expect(page.getByRole("status")).toHaveText("Card details look right. This demo sends nothing.");
    });

    test("lean variant: no name or postcode", async ({ page }) => {
      await open(page, target.url("lean"));
      await expect(field(page, "Name on card")).toHaveCount(0);
      await expect(field(page, "Postcode")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Pay now £49.00" })).toBeVisible();
    });
  });
}

test("registry serves the card fields with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/card-fields.json?showPostcode=false&amount=%2412.00")).json();
  expect(item).toMatchObject({ name: "card-fields", type: "registry:component" });
  expect(item.files[0].content).toContain('"showPostcode": false');
  expect(item.files[0].content).toContain('"amount": "$12.00"');
});
