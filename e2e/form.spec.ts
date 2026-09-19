import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.form.variants);
const field = (page: Page, name: string | RegExp) => page.getByLabel(name);
const submit = (page: Page, name = "Send message") => page.getByRole("button", { name });

for (const target of targets("form")) {
  test.describe(`form — ${target.name} export`, () => {
    test("no axe violations: empty, and showing every error", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
        await page.getByRole("button", { name: /^(Send|Report|Submit)/ }).click();
        await expectNoAxeViolations(page);
      }
    });

    test("submitting an empty form lists every problem and moves focus to the summary", async ({ page }) => {
      await open(page, target.url("default"));
      await submit(page).click();

      const summary = page.getByRole("alert", { name: "There is a problem" });
      await expect(summary).toBeFocused();
      await expect(summary.getByRole("heading", { name: "There is a problem" })).toBeVisible();
      // Name, email, the select, the message and the checkbox — the phone is optional.
      await expect(summary.getByRole("link")).toHaveCount(5);
      await expect(summary.getByRole("link", { name: "Enter full name." })).toBeVisible();
      await expect(summary.getByRole("link", { name: "Select how can we help." })).toBeVisible();
      await expect(summary.getByRole("link", { name: /^Select .I agree to be contacted/ })).toBeVisible();
      await expect(field(page, /^Full name/)).toHaveAttribute("aria-invalid", "true");
    });

    test("a summary link moves focus to the field that needs fixing", async ({ page }) => {
      await open(page, target.url("default"));
      await submit(page).click();
      await page.getByRole("link", { name: "Enter email address." }).click();
      await expect(field(page, /^Email address/)).toBeFocused();
    });

    test("each type is checked by its own rule, and errors clear as they are corrected", async ({ page }) => {
      await open(page, target.url("default"));

      const email = field(page, /^Email address/);
      await email.fill("not-an-email");
      await email.blur();
      await expect(email).toHaveAccessibleDescription(
        "Error: Enter an email address in the correct format, like name@example.com.",
      );
      await email.fill("someone@example.com");
      await expect(email).not.toHaveAttribute("aria-invalid");

      const phone = field(page, /^Phone number/);
      await phone.fill("12345");
      await phone.blur();
      await expect(phone).toHaveAccessibleDescription(
        "Error: Enter a phone number using only digits, spaces, brackets, + or -, like +44 20 7946 0000.",
      );
      await phone.fill("+44 20 7946 0000");
      await expect(phone).not.toHaveAttribute("aria-invalid");

      const message = field(page, /^Message/);
      await message.fill("Too short");
      await message.blur();
      await expect(message).toHaveAccessibleDescription(
        /Message must be at least 20 characters\. You have entered 9\./,
      );
    });

    test("an optional field left empty is fine, and the counter counts down", async ({ page }) => {
      await open(page, target.url("default"));
      const phone = field(page, /^Phone number/);
      await phone.click();
      await phone.blur();
      await expect(phone).not.toHaveAttribute("aria-invalid");
      await expect(page.getByText("(optional)")).toBeVisible();

      await field(page, /^Message/).fill("Twelve chars");
      await expect(page.getByText("488 characters remaining")).toBeVisible(); // 500 - 12
    });

    test("a valid form announces success and empties itself", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page, /^Full name/).fill("Alex Fisher");
      await field(page, /^Email address/).fill("alex@example.com");
      await field(page, /^How can we help/).selectOption("Support");
      await field(page, /^Message/).fill("I would like a quote for a five page marketing site.");
      await page.getByRole("checkbox").check();
      await submit(page).click();

      const success = page.getByRole("status");
      await expect(success).toHaveText("Thanks. Your message has been sent.");
      await expect(success).toBeFocused();
      await expect(field(page, /^Full name/)).toHaveValue("");
    });

    test("strict variant: custom pattern, number range, checks only on submit", async ({ page }) => {
      await open(page, target.url("strict"));
      const order = field(page, /^Order number/);
      await order.fill("nope");
      await order.blur();
      // Nothing is checked until the form is sent.
      await expect(order).not.toHaveAttribute("aria-invalid");

      await field(page, /^Full name/).fill("Alex Fisher");
      await field(page, /^Quantity/).fill("42");
      await submit(page, "Send message").click();
      await expect(page.getByRole("alert", { name: "There is a problem" })).toHaveCount(0); // summary is off
      await expect(order).toBeFocused(); // focus goes to the first problem instead

      await expect(order).toHaveAccessibleDescription(
        /Enter order number in the format described: Two letters, a dash and four digits, like AB-1234/,
      );
      await expect(field(page, /^Quantity/)).toHaveAccessibleDescription(/Quantity must be 10 or less\./);
      await expect(page.getByText("(required)").first()).toBeVisible();

      // Correcting a field that is already wrong clears it as you type, whatever the setting.
      await order.fill("AB-1234");
      await expect(order).not.toHaveAttribute("aria-invalid");
    });
  });
}

test("registry serves the form with config from the URL", async ({ request }) => {
  const query = new URLSearchParams({
    fields: JSON.stringify([{ label: "Nickname", type: "text", required: "yes", min: "", max: "", pattern: "", options: "", help: "" }]),
    validateOn: "never",
    marker: "none",
  });
  const item = await (await request.get(`/r/form.json?${query}`)).json();
  expect(item).toMatchObject({ name: "form", type: "registry:component" });
  expect(item.files[0].content).toContain('"label": "Nickname"');
  expect(item.files[0].content).toContain('"validateOn": "blur"'); // unknown value falls back
  expect(item.files[0].content).toContain('"marker": "none"');
});
