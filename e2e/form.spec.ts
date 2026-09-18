import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.form.variants);
const field = (page: Page, name: string | RegExp) => page.getByRole("textbox", { name });
const submit = (page: Page) => page.getByRole("button", { name: "Send message" });

for (const target of targets("form")) {
  test.describe(`form — ${target.name} export`, () => {
    test("no axe violations: empty, and showing every error", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
        await page.getByRole("button", { name: /^Send/ }).click();
        await expectNoAxeViolations(page);
      }
    });

    test("submitting an empty form lists every problem and moves focus to the summary", async ({ page }) => {
      await open(page, target.url("default"));
      await submit(page).click();

      const summary = page.getByRole("alert", { name: "There is a problem" });
      await expect(summary).toBeFocused();
      await expect(summary.getByRole("heading", { name: "There is a problem" })).toBeVisible();
      await expect(summary.getByRole("link")).toHaveCount(4); // name, email, message, consent

      await expect(summary.getByRole("link", { name: "Enter your full name." })).toBeVisible();
      await expect(summary.getByRole("link", { name: "Enter your email address." })).toBeVisible();
      await expect(summary.getByRole("link", { name: "Select the checkbox to agree before sending." })).toBeVisible();
      await expect(field(page, /^Full name/)).toHaveAttribute("aria-invalid", "true");
    });

    test("messages name the problem and the fix, and clear as you correct them", async ({ page }) => {
      await open(page, target.url("default"));
      const email = field(page, /^Email address/);
      await email.fill("not-an-email");
      await email.blur();
      await expect(email).toHaveAccessibleDescription(
        "Error: Enter an email address in the correct format, like name@example.com.",
      );

      await email.fill("someone@example.com");
      await expect(email).not.toHaveAttribute("aria-invalid");

      const message = field(page, /^Message/);
      await message.fill("Too short");
      await message.blur();
      await expect(message).toHaveAccessibleDescription(
        "Error: Your message must be at least 20 characters. You have written 9.",
      );

      const phone = field(page, /^Phone number/);
      await phone.fill("12345");
      await phone.blur();
      await expect(phone).toHaveAccessibleDescription(
        "Error: Enter a phone number using only digits, spaces, brackets, + or -, like +44 20 7946 0000.",
      );
      await phone.fill("+44 20 7946 0000");
      await expect(phone).not.toHaveAttribute("aria-invalid");
    });

    test("a valid form announces success and empties itself", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page, /^Full name/).fill("Alex Fisher");
      await field(page, /^Email address/).fill("alex@example.com");
      await field(page, /^Message/).fill("I would like a quote for a five page marketing site.");
      await page.getByRole("checkbox").check();
      await submit(page).click();

      const success = page.getByRole("status");
      await expect(success).toHaveText("Thanks. Your message has been sent.");
      await expect(success).toBeFocused();
      await expect(field(page, /^Full name/)).toHaveValue("");
    });

    test("strict variant: checks only on submit, focus goes to the first problem", async ({ page }) => {
      await open(page, target.url("strict"));
      const email = field(page, /^Email address/);
      await email.fill("nope");
      await email.blur();
      // Nothing is checked until the form is sent.
      await expect(email).not.toHaveAttribute("aria-invalid");

      await page.getByRole("button", { name: "Send message" }).click();
      await expect(page.getByRole("alert", { name: "There is a problem" })).toHaveCount(0); // summary is off
      await expect(field(page, /^Full name/)).toBeFocused();
      await expect(field(page, /^Phone number/)).toHaveAttribute("aria-invalid", "true"); // required here
    });
  });
}

test("registry serves the form with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/form.json?messageMinLength=9999&validateOn=never")).json();
  expect(item).toMatchObject({ name: "form", type: "registry:component" });
  expect(item.files[0].content).toContain('"messageMinLength": 500'); // clamped to the schema maximum
  expect(item.files[0].content).toContain('"validateOn": "blur"'); // unknown value falls back
});
