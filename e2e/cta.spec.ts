import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.cta.variants);
const section = (page: Page) => page.getByRole("region", { name: /Ready to start|Book a call/ });

for (const target of targets("cta")) {
  test.describe(`CTA section — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("default: heading, supporting text and two working links", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("heading", { level: 2, name: "Ready to start your project?" })).toBeVisible();
      await expect(page.getByText("Tell us what you need")).toBeVisible();

      const primary = page.getByRole("link", { name: "Get in touch" });
      await expect(primary).toHaveAttribute("href", "/contact");
      await expect(page.getByRole("link", { name: "See our work" })).toHaveAttribute("href", "/work");

      // The section is a landmark, so a screen reader can jump straight to it.
      await expect(section(page)).toBeVisible();

      // Both actions take focus. (Safari only Tabs to links when the user turns that on, so
      // focusing directly is the portable check.)
      await primary.focus();
      await expect(primary).toBeFocused();
      const secondary = page.getByRole("link", { name: "See our work" });
      await secondary.focus();
      await expect(secondary).toBeFocused();
    });

    test("plain variant: one button, a note, H3, and the dark surface", async ({ page }) => {
      await open(page, target.url("plain"));
      await expect(page.getByRole("heading", { level: 3, name: "Book a call" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Choose a time" })).toHaveAttribute("href", "/call");
      await expect(page.getByRole("link", { name: "See our work" })).toHaveCount(0);
      await expect(page.getByText("No commitment. We reply to every message.")).toBeVisible();
      await expect(section(page)).toHaveCSS("background-color", "rgb(22, 22, 28)");
    });
  });
}

test("the exported HTML needs no JavaScript at all", async ({ request }) => {
  const item = await (await request.get("/r/cta.json?layout=left&spacing=huge")).json();
  expect(item).toMatchObject({ name: "cta", type: "registry:component" });
  expect(item.files[0].content).toContain('"layout": "left"');
  expect(item.files[0].content).toContain('"spacing": "regular"'); // invalid value falls back to the default
});
