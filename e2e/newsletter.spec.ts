import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["newsletter"].variants);
const field = (page: Page) => page.getByRole("textbox", { name: "Email address" });
const consent = (page: Page) => page.getByRole("checkbox");
const submit = (page: Page) => page.getByRole("button", { name: /Sign me up|Subscribe/ });
const alert = (page: Page) => page.getByRole("alert").filter({ hasText: /email address|Tick the box/ });

for (const target of targets("newsletter")) {
  test.describe(`newsletter — ${target.name} export`, () => {
    test("no axe violations for every variant, and with an error showing", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await submit(page).click();
      await expectNoAxeViolations(page);
    });

    test("an empty or malformed address is refused in words", async ({ page }) => {
      await open(page, target.url("default"));
      await submit(page).click();
      await expect(alert(page)).toHaveText("Enter an email address like name@example.com.");
      await expect(field(page)).toHaveAttribute("aria-invalid", "true");
      await expect(field(page)).toBeFocused();
      await field(page).fill("nope");
      await submit(page).click();
      await expect(alert(page)).toBeVisible();
    });

    test("consent is not pre-ticked, and its error sends focus to the box", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(consent(page)).not.toBeChecked();
      await field(page).fill("ade@example.com");
      await submit(page).click();
      await expect(alert(page)).toHaveText("Tick the box to say we may email you.");
      await expect(consent(page)).toBeFocused();
      // The consent message is not about the field, so the field is not marked invalid.
      await expect(field(page)).not.toHaveAttribute("aria-invalid", "true");
    });

    test("signing up keeps the form and says what happened", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page).fill("ade@example.com");
      await consent(page).check();
      await submit(page).click();
      await expect(page.getByRole("status")).toHaveText("Thanks — check your inbox to confirm it is you.");
      await expect(field(page)).toHaveValue("");
      await expect(consent(page)).not.toBeChecked();
      await expect(submit(page)).toBeVisible();
    });

    test("stacked variant: no consent box needed", async ({ page }) => {
      await open(page, target.url("stacked"));
      await expect(consent(page)).toHaveCount(0);
      await field(page).fill("ade@example.com");
      await submit(page).click();
      await expect(page.getByRole("status")).toContainText("check your inbox");
    });
  });
}

test("registry serves the newsletter with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/newsletter.json?layout=stacked&requireConsent=false")).json();
  expect(item).toMatchObject({ name: "newsletter", type: "registry:component" });
  expect(item.files[0].content).toContain('"layout": "stacked"');
  expect(item.files[0].content).toContain('"requireConsent": false');
});
