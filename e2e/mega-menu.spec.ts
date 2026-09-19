import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["mega-menu"].variants);
const menu = (page: Page, name: string) => page.getByRole("button", { name, exact: false });

/** Clicking a real link would navigate away from the harness page. */
async function holdLinks(page: Page) {
  await page.addInitScript(() => {
    document.addEventListener(
      "click",
      (event) => {
        const link = (event.target as HTMLElement | null)?.closest("a");
        if (link) event.preventDefault();
      },
      true,
    );
  });
}

for (const target of targets("mega-menu")) {
  test.describe(`mega menu — ${target.name} export`, () => {
    test("no axe violations: closed, and with a panel open", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
        await menu(page, "Products").click();
        await expectNoAxeViolations(page);
      }
    });

    test("a panel opens with its columns, and only one is open at a time", async ({ page }) => {
      await open(page, target.url("default"));
      const products = menu(page, "Products");
      await expect(products).toHaveAttribute("aria-expanded", "false");

      await products.click();
      await expect(products).toHaveAttribute("aria-expanded", "true");
      await expect(page.getByText("Build", { exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: /^Registry/ })).toBeVisible();
      await expect(page.getByText("Install by URL")).toBeVisible();

      await menu(page, "Solutions").click();
      await expect(products).toHaveAttribute("aria-expanded", "false");
      await expect(menu(page, "Solutions")).toHaveAttribute("aria-expanded", "true");
      await expect(page.getByRole("link", { name: /^Agencies/ })).toBeVisible();
    });

    test("Escape closes the panel and puts focus back on the button", async ({ page }) => {
      await open(page, target.url("default"));
      const products = menu(page, "Products");
      await products.click();
      await page.keyboard.press("Escape");
      await expect(products).toHaveAttribute("aria-expanded", "false");
      await expect(products).toBeFocused();
    });

    test("Arrow Down opens the menu and goes to its first link", async ({ page }) => {
      await open(page, target.url("default"));
      const products = menu(page, "Products");
      await products.focus();
      await page.keyboard.press("ArrowDown");
      await expect(products).toHaveAttribute("aria-expanded", "true");
      await expect(page.getByRole("link", { name: /^Editor/ })).toBeFocused();
    });

    test("clicking outside closes the open panel", async ({ page }) => {
      await open(page, target.url("default"));
      const products = menu(page, "Products");
      await products.click();
      await page.mouse.click(5, 400);
      await expect(products).toHaveAttribute("aria-expanded", "false");
    });

    test("picking a link closes the panel it came from", async ({ page }) => {
      await holdLinks(page);
      await open(page, target.url("default"));
      const products = menu(page, "Products");
      await products.click();
      await page.getByRole("link", { name: /^Editor/ }).click();
      await expect(products).toHaveAttribute("aria-expanded", "false");
    });

    test("wide variant: hover opens, no descriptions, no call to action", async ({ page }) => {
      await open(page, target.url("wide"));
      await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Start free" })).toHaveCount(0);

      // Hovering opens the panel here, so clicking the button would close it again.
      await menu(page, "Products").hover();
      await expect(menu(page, "Products")).toHaveAttribute("aria-expanded", "true");
      await expect(page.getByText("Install by URL")).toHaveCount(0);
      await expect(page.getByRole("link", { name: "Registry" })).toBeVisible();
    });
  });
}

test("registry serves the mega menu with config from the URL", async ({ request }) => {
  const query = new URLSearchParams({
    items: JSON.stringify([{ menu: "Evil", group: "", label: "Click", href: "javascript:alert(1)", description: "" }]),
    columns: "9",
  });
  const item = await (await request.get(`/r/mega-menu.json?${query}`)).json();
  expect(item).toMatchObject({ name: "mega-menu", type: "registry:component" });
  expect(item.files[0].content).not.toContain("javascript:");
  expect(item.files[0].content).toContain('"href": "#"');
  expect(item.files[0].content).toContain('"columns": "2"'); // unknown value falls back
});
