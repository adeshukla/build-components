import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.cart.variants);
const button = (page: Page, name: string | RegExp) => page.getByRole("button", { name });
const totals = (page: Page, term: string) => page.getByRole("definition").filter({ hasText: term });

for (const target of targets("cart")) {
  test.describe(`basket — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("lines, line totals and the totals all add up", async ({ page }) => {
      await open(page, target.url("default"));
      // 2 x 18.00 + 24.50 + 9.00 = 69.50, which is over the 50 free-delivery threshold.
      await expect(page.getByText("£69.50").first()).toBeVisible();
      await expect(page.getByText("4 items")).toBeVisible();
      await expect(page.getByText("Delivery is free on this order.")).toBeVisible();
      await expect(page.getByText("£36.00")).toBeVisible(); // the notebook line, 2 x 18.00
    });

    test("the plus button raises the quantity, the line total and the totals", async ({ page }) => {
      await open(page, target.url("default"));
      await button(page, "Increase quantity of Ink refill").click();
      await expect(page.getByLabel("Quantity of Ink refill")).toHaveValue("2");
      await expect(page.getByText("£78.50").first()).toBeVisible(); // 69.50 + 9.00
      await expect(page.getByText("5 items")).toBeVisible();
    });

    test("the minus button stops at one", async ({ page }) => {
      await open(page, target.url("default"));
      const minus = button(page, "Decrease quantity of Field notebook");
      await minus.click();
      await expect(page.getByLabel("Quantity of Field notebook")).toHaveValue("1");
      await expect(minus).toBeDisabled();
      // 18.00 + 24.50 + 9.00 = 51.50, still over the threshold.
      await expect(page.getByText("£51.50").first()).toBeVisible();
    });

    test("dropping under the threshold asks for more and charges delivery", async ({ page }) => {
      await open(page, target.url("default"));
      await button(page, "Remove Field notebook from the basket").click();
      // 24.50 + 9.00 = 33.50, so delivery is charged again.
      await expect(page.getByText("Spend £16.50 more for free delivery.")).toBeVisible();
      await expect(totals(page, "£4.95")).toBeVisible();
      await expect(page.getByText("£38.45").first()).toBeVisible(); // 33.50 + 4.95
    });

    test("removing every line shows the empty message and stops checkout", async ({ page }) => {
      await open(page, target.url("default"));
      for (const name of ["Field notebook", "Drafting pencil", "Ink refill"]) {
        await button(page, `Remove ${name} from the basket`).click();
      }
      // Exact: the announcement ends with the same sentence.
      await expect(page.getByText("Your basket is empty.", { exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: "Checkout" })).toHaveAttribute("aria-disabled", "true");
    });

    test("drawer variant: opens, closes on Escape, and counts its items", async ({ page }) => {
      await open(page, target.url("drawer"));
      const opener = button(page, /^Cart/);
      await expect(opener).toContainText("(4)");
      await expect(page.getByRole("heading", { name: "Your cart" })).toBeHidden();

      await opener.click();
      const drawer = page.getByRole("dialog");
      await expect(drawer).toBeVisible();
      await expect(drawer.getByText("$69.50").first()).toBeVisible(); // dollars here
      await expect(drawer.getByText("Quantity 2")).toBeVisible(); // stepper off in this variant

      await page.keyboard.press("Escape");
      await expect(drawer).toBeHidden();
    });
  });
}

test("registry serves the basket with config from the URL", async ({ request }) => {
  const query = new URLSearchParams({
    lines: JSON.stringify([{ name: "Thing", variant: "", price: "10", quantity: "3" }]),
    currency: "YEN",
    freeShippingOver: "9999",
    checkoutHref: "javascript:alert(1)",
  });
  const item = await (await request.get(`/r/cart.json?${query}`)).json();
  expect(item).toMatchObject({ name: "cart", type: "registry:component" });
  expect(item.files[0].content).not.toContain("javascript:");
  expect(item.files[0].content).toContain('"currency": "GBP"'); // unknown value falls back
  expect(item.files[0].content).toContain('"freeShippingOver": 500'); // clamped to the schema maximum
});
