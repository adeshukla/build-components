import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.header.variants);
const menuButton = (page: Page) => page.getByRole("button", { name: "Menu" });
/** Stop real links from navigating away, without stopping the component's own click handlers. */
const holdLinks = (page: Page) =>
  page.evaluate(() =>
    document.addEventListener(
      "click",
      (event) => {
        if ((event.target as HTMLElement).closest("a")) event.preventDefault();
      },
      true,
    ),
  );
const link = (page: Page, name: string) => page.getByRole("link", { name, exact: true });

for (const target of targets("header")) {
  test.describe(`site header — ${target.name} export`, () => {
    test("no axe violations for every variant, wide and narrow", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await page.setViewportSize({ width: 1280, height: 800 });
        await expectNoAxeViolations(page);
        await page.setViewportSize({ width: 390, height: 780 });
        await expectNoAxeViolations(page);
      }
    });

    test("wide screens: links sit in the bar and there is no menu button", async ({ page }) => {
      await open(page, target.url("default"));
      await page.setViewportSize({ width: 1280, height: 800 });
      await expect(link(page, "Services")).toBeVisible();
      await expect(link(page, "Start a project")).toBeVisible();
      await expect(menuButton(page)).toHaveCount(0);
    });

    test("narrow screens: links move into the menu, Escape closes it", async ({ page }) => {
      await open(page, target.url("default"));
      await page.setViewportSize({ width: 390, height: 780 });

      const button = menuButton(page);
      await expect(button).toBeVisible();
      await expect(button).toHaveAttribute("aria-expanded", "false");
      await expect(link(page, "Services")).toHaveCount(0);

      await button.click();
      await expect(button).toHaveAttribute("aria-expanded", "true");
      await expect(link(page, "Services")).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(button).toHaveAttribute("aria-expanded", "false");
      await expect(link(page, "Services")).toHaveCount(0);
      await expect(button).toBeFocused();

      // Choosing a link closes the menu too.
      await holdLinks(page);
      await button.click();
      await link(page, "Work").click();
      await expect(button).toHaveAttribute("aria-expanded", "false");
    });

    test("the skip link stays hidden until it is focused", async ({ page }) => {
      await open(page, target.url("default"));
      await page.setViewportSize({ width: 1280, height: 800 });
      const skip = link(page, "Skip to content");
      const before = (await skip.boundingBox())!;
      expect(before.y).toBeLessThan(0);

      await skip.focus();
      // It slides in, so poll until the transition has finished.
      await expect.poll(async () => (await skip.boundingBox())!.y).toBeGreaterThan(0);
    });

    test("wide variant: sticky, no call to action, and it collapses later", async ({ page }) => {
      await open(page, target.url("wide"));
      await page.setViewportSize({ width: 700, height: 800 });
      // In the harness the header sits inside <main>, so it is a <header> element, not a banner landmark.
      await expect(page.locator("header").first()).toHaveCSS("position", "sticky");
      await expect(link(page, "Start a project")).toHaveCount(0);
      // Breakpoint "sm" means the links are already in the bar at 700px.
      await expect(link(page, "Services")).toBeVisible();
      await expect(menuButton(page)).toHaveCount(0);
    });
  });
}

test("registry serves the header with config from the URL", async ({ request }) => {
  const item = await (
    await request.get('/r/header.json?mobileBreakpoint=lg&links=%5B%7B%22label%22%3A%22Docs%22%2C%22href%22%3A%22javascript%3Aalert(1)%22%7D%5D')
  ).json();
  expect(item).toMatchObject({ name: "header", type: "registry:component" });
  expect(item.files[0].content).toContain('"mobileBreakpoint": "lg"');
  // A link that tries to run script is replaced before it ever reaches the exported file.
  expect(item.files[0].content).not.toContain("javascript:");
  expect(item.files[0].content).toContain('"href": "#"');
});
