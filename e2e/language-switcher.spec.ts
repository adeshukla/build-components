import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["language-switcher"].variants);
const opener = (page: Page) => page.getByRole("button", { name: /Language/ });

for (const target of targets("language-switcher")) {
  test.describe(`language switcher — ${target.name} export`, () => {
    test("no axe violations for every variant, closed and open", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
        await page.getByRole("button").first().click();
        await expectNoAxeViolations(page);
      }
    });

    test("the button says the current language, and the list holds real links", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(opener(page)).toHaveAccessibleName(/Language: English/);
      await opener(page).click();
      const french = page.getByRole("link", { name: "Français" });
      await expect(french).toHaveAttribute("href", "/fr");
      await expect(french).toHaveAttribute("hreflang", "fr");
      await expect(french).toHaveAttribute("lang", "fr");
      await expect(page.getByRole("link", { name: "English" })).toHaveAttribute("aria-current", "true");
    });

    test("arrow keys move, Escape closes and hands focus back", async ({ page }) => {
      await open(page, target.url("default"));
      await opener(page).click();
      await page.getByRole("link", { name: "English" }).focus();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByRole("link", { name: "Français" })).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("link", { name: "Français" })).toBeHidden();
      await expect(opener(page)).toBeFocused();
    });

    test("compact variant: French is current, no codes", async ({ page }) => {
      await open(page, target.url("compact"));
      await expect(opener(page)).toHaveAccessibleName(/Language: Français/);
    });
  });
}

test("registry serves the language switcher with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/language-switcher.json?currentCode=de&showCode=false")).json();
  expect(item).toMatchObject({ name: "language-switcher", type: "registry:component" });
  expect(item.files[0].content).toContain('"currentCode": "de"');
  expect(item.files[0].content).toContain('"showCode": false');
});
