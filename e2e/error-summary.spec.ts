import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["error-summary"].variants);
const submit = (page: Page) => page.getByRole("button", { name: /Continue|Send/ });
const summary = (page: Page) => page.getByRole("group", { name: /problem/i });

for (const target of targets("error-summary")) {
  test.describe(`error summary — ${target.name} export`, () => {
    test("no axe violations for every variant, clean and with problems", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await submit(page).click();
      await expectNoAxeViolations(page);
    });

    test("nothing is summarised before the form is submitted", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(summary(page)).toHaveCount(0);
    });

    test("submitting with problems lists them and takes focus to the list", async ({ page }) => {
      await open(page, target.url("default"));
      await submit(page).click();
      await expect(summary(page)).toBeVisible();
      await expect(summary(page).getByRole("link")).toHaveCount(2);
      await expect(summary(page)).toBeFocused();
      await expect(summary(page).getByRole("link", { name: "Enter your full name" })).toBeVisible();
    });

    test("each problem links to the answer it is about", async ({ page }) => {
      await open(page, target.url("default"));
      await submit(page).click();
      await summary(page).getByRole("link", { name: /email address/ }).click();
      await expect(page.getByRole("textbox", { name: /Email address/ })).toBeFocused();
    });

    test("the message is repeated at the field and clears as it is typed", async ({ page }) => {
      await open(page, target.url("default"));
      await submit(page).click();
      const name = page.getByRole("textbox", { name: /Full name/ });
      await expect(name).toHaveAttribute("aria-invalid", "true");
      await expect(name).toHaveAccessibleDescription(/Enter your full name/);
      await name.fill("Adesh");
      await expect(name).not.toHaveAttribute("aria-invalid", "true");
      await expect(summary(page).getByRole("link")).toHaveCount(1);
    });

    test("a badly shaped answer is explained, not just refused", async ({ page }) => {
      await open(page, target.url("default"));
      await page.getByRole("textbox", { name: /Full name/ }).fill("Adesh");
      await page.getByRole("textbox", { name: /Email address/ }).fill("not-an-address");
      await submit(page).click();
      await expect(summary(page).getByRole("link", { name: /name@example.com/ })).toBeVisible();
    });

    test("a form with no problems says so instead of summarising", async ({ page }) => {
      await open(page, target.url("default"));
      await page.getByRole("textbox", { name: /Full name/ }).fill("Adesh");
      await page.getByRole("textbox", { name: /Email address/ }).fill("ade@example.com");
      await submit(page).click();
      await expect(summary(page)).toHaveCount(0);
      await expect(page.getByRole("status")).toHaveText(/accepted/);
    });

    test("counted variant: the heading counts the problems", async ({ page }) => {
      await open(page, target.url("counted"));
      await submit(page).click();
      await expect(page.getByRole("heading", { name: "2 problems to fix" })).toBeVisible();
    });
  });
}

test("registry serves the error summary with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/error-summary.json?countInHeading=true&submitLabel=Send")).json();
  expect(item).toMatchObject({ name: "error-summary", type: "registry:component" });
  expect(item.files[0].content).toContain('"countInHeading": true');
  expect(item.files[0].content).toContain('"submitLabel": "Send"');
});
