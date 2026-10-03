import { expect, test, type Page } from "@playwright/test";
import { MAX_SECTIONS, newSection, type BuiltPage } from "../lib/page-builder";
import { inStock } from "../lib/parts";
import { isRegistrySlug } from "../lib/registry";
import { encodeSite, siteFromPage } from "../lib/site-builder";
import { colourFamilies, lookOf, type PresetId } from "../lib/theme";
import { expectNoAxeViolations } from "./helpers";

/*
 * The site theme (D87): every part takes it, in both outputs, and stays accessible under it; the builder
 * applies it; the visitor's light and dark switch moves the whole page.
 */

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

test("every colour family keeps text and muted text readable on its surfaces, light and dark", () => {
  for (const [name, family] of Object.entries(colourFamilies)) {
    for (const scheme of ["light", "dark"] as const) {
      const c = family[scheme];
      for (const ground of [c.surface, c.sunk]) {
        expect(ratio(c.text, ground), `${name} ${scheme} text`).toBeGreaterThanOrEqual(7);
        expect(ratio(c.muted, ground), `${name} ${scheme} muted`).toBeGreaterThanOrEqual(4.5);
      }
    }
  }
});

/** A page of parts under a theme, as the builder would make it. */
const themed = (slugs: string[], preset: PresetId, theme: "light" | "dark"): BuiltPage => ({
  name: "Northwind",
  brand: "#2563eb",
  theme,
  look: lookOf(preset),
  sections: slugs.filter(isRegistrySlug).map(newSection),
});
const everyPart = inStock.map((part) => part.slug).filter(isRegistrySlug);
const batches = Array.from({ length: Math.ceil(everyPart.length / MAX_SECTIONS) }, (_, i) => everyPart.slice(i * MAX_SECTIONS, (i + 1) * MAX_SECTIONS));
const looks: [PresetId, "light" | "dark"][] = [
  ["editorial", "light"],
  ["bold", "dark"],
];

test.describe("every part under a theme", () => {
  test.skip(({ browserName, isMobile }) => browserName !== "chromium" || isMobile, "Chromium: the same parts are tested in every browser on their own");
  test.describe.configure({ timeout: 120_000 });

  for (const [preset, theme] of looks) {
    for (const [index, slugs] of batches.entries()) {
      test(`${preset}, ${theme}: parts ${index * MAX_SECTIONS + 1}–${index * MAX_SECTIONS + slugs.length}, React`, async ({ page }) => {
        await page.goto("/preview-page");
        await page.locator("[data-ready]").waitFor({ state: "attached" });
        await page.evaluate((state) => window.postMessage({ type: "built-page", state }, window.location.origin), themed(slugs, preset, theme));
        await expect(page.locator("[data-part]")).toHaveCount(slugs.length);
        // The theme reached the parts: the page is the theme's surface.
        const surface = colourFamilies[lookOf(preset).colours][theme].surface;
        await expect(page.locator(".bc-page")).toHaveCSS("background-color", hexToRgb(surface));
        await expectNoAxeViolations(page);
      });

      test(`${preset}, ${theme}: parts ${index * MAX_SECTIONS + 1}–${index * MAX_SECTIONS + slugs.length}, HTML`, async ({ page, request }) => {
        const link = await encodeSite(siteFromPage(themed(slugs, preset, theme)));
        const site = await (await request.get(`/download/page-html.json?p=${link}`)).json();
        await page.setContent(site["index.html"]);
        await expectNoAxeViolations(page);
      });
    }
  }
});

function hexToRgb(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}

test.describe("the theme in the builder", () => {
  test.skip(({ browserName, isMobile }) => browserName !== "chromium" || isMobile, "Chromium only: plain layout");
  test.use({ viewport: { width: 1440, height: 1000 } });
  const frameOf = (page: Page) => page.frameLocator('iframe[title="Your page, React output"]');

  test("a preset styles every section; fine-tuning changes one thing; the visitors' switch darkens the page", async ({ page }) => {
    await page.goto("/build");
    await page.getByRole("button", { name: /^Landing page/ }).click();
    await page.getByRole("button", { name: "Page settings" }).click();
    await page.getByRole("button", { name: /^Editorial/ }).click();
    await expect(page.getByRole("button", { name: /^Editorial/ })).toHaveAttribute("aria-pressed", "true");
    const heading = frameOf(page).locator("h1").first();
    await expect.poll(() => heading.evaluate((el) => getComputedStyle(el).fontFamily), { timeout: 15_000 }).toContain("Iowan Old Style");
    const button = frameOf(page).locator('[data-part="hero"] a').first();
    await expect(button).toHaveCSS("border-radius", "0px");

    await page.getByText("Fine-tune").click();
    await page.getByLabel("Buttons").selectOption("pill");
    await expect(button).toHaveCSS("border-radius", "999px");

    await page.getByRole("checkbox", { name: /Visitors can switch light and dark/ }).check();
    await page.getByRole("button", { name: "Preview", exact: true }).click();
    const switcher = frameOf(page).getByRole("button", { name: "Dark theme" });
    await switcher.click();
    await expect(switcher).toHaveAttribute("aria-pressed", "true");
    await expect(frameOf(page).locator(".bc-page")).toHaveCSS("background-color", hexToRgb(colourFamilies.warm.dark.surface));
  });
});
