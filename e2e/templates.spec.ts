import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readTemplateSources } from "../lib/sources";
import { templateHtml } from "../lib/template-output";
import { defaultOptions, templates, type TemplateOptions } from "../lib/templates";
import { expectNoAxeViolations } from "./helpers";

/*
 * Templates are tested as pages (D75): what each part is tested for on its own, plus what only a page
 * can get wrong. Both outputs: the React page, rendered from the parts, and the one HTML file.
 */

/** What a page must be, whichever output it is. */
async function expectAPage(page: Page) {
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("main")).toHaveCount(1);
  await expectNoAxeViolations(page);
  // The first thing Tab reaches skips to the content, and that content exists. Read from the page rather
  // than pressed: Safari only Tabs to links when the reader has turned that on.
  const first = await page.evaluate(() => {
    const focusable = [...document.querySelectorAll<HTMLElement>("a[href], button, input, select, textarea, summary, [tabindex]")];
    return focusable.find((el) => el.tabIndex >= 0 && !el.closest("[hidden], [inert]"))?.getAttribute("href");
  });
  expect(first).toBe("#main");
  await expect(page.locator("#main")).toHaveCount(1);
}

const variants: { name: string; options: (id: string) => Partial<TemplateOptions> }[] = [
  { name: "as it comes", options: () => ({}) },
  { name: "dark, with a pale brand colour and every optional section off", options: () => ({ theme: "dark", brand: "#fbbf24", sections: [] }) },
];

for (const template of templates) {
  test.describe(`${template.name} template`, () => {
    for (const variant of variants) {
      test(`the React page is a page, ${variant.name}`, async ({ page }) => {
        const options = { ...defaultOptions(template), ...variant.options(template.id) };
        const query = new URLSearchParams({ name: options.name, brand: options.brand, theme: options.theme, sections: options.sections.join(",") });
        await page.goto(`/preview-template/${template.id}?${query}`);
        await page.locator("[data-ready]").waitFor({ state: "attached", timeout: 20_000 });
        await expectAPage(page);
      });

      test(`the HTML page is a page, ${variant.name}`, async ({ page }) => {
        const options = { ...defaultOptions(template), ...variant.options(template.id) };
        const { sources } = readTemplateSources(template.sections.map((section) => section.slug));
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(String(error)));
        await page.setContent(templateHtml(template, options, sources));
        await expectAPage(page);
        expect(errors).toEqual([]);
      });
    }

    // Down to 300px, the narrowest screen still in use, in both outputs.
    for (const width of [375, 300]) {
      test(`fits ${width}px without scrolling sideways, as React and as HTML`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(`/preview-template/${template.id}`);
        await page.locator("[data-ready]").waitFor({ state: "attached", timeout: 20_000 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);

        const { sources } = readTemplateSources(template.sections.map((section) => section.slug));
        await page.setContent(templateHtml(template, defaultOptions(template), sources));
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      });
    }

    test("installs as one block: every part by URL with the options in it, and the page", async ({ request }) => {
      const response = await request.get(`/r/templates/${template.id}.json?name=Tidewater&brand=%237c2d12&theme=dark`);
      expect(response.ok()).toBe(true);
      const item = await response.json();
      expect(item.type).toBe("registry:block");
      expect(item.files).toHaveLength(1);
      expect(item.files[0].target).toBe(`app/${template.id}/page.tsx`);
      for (const url of item.registryDependencies as string[]) {
        expect(url).toMatch(/\/r\/[a-z-]+\.json\?/);
        expect(url).toContain("theme=dark");
        // A colour no part has as its default, so every part has to carry it.
        expect(url).toContain("accentColor=%237c2d12");
        // The page imports every part it depends on.
        const slug = /\/r\/([a-z-]+)\.json/.exec(url)![1];
        expect(item.files[0].content).toContain(`from "@/components/${slug}"`);
      }
    });
  });
}

test("the templates page lists every template, and each one opens", async ({ page }) => {
  await page.goto("/templates");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Templates");
  for (const template of templates) {
    await expect(page.getByRole("link", { name: template.name, exact: true })).toHaveAttribute("href", `/templates/${template.id}`);
  }
  await expectNoAxeViolations(page);
});

test.describe("the template editor", () => {
  test.skip(({ browserName, isMobile }) => browserName !== "chromium" || isMobile, "Chromium only: plain layout");

  test("changes reach the page, both outputs pass their checks, and the page has no violations of its own", async ({ page }) => {
    await page.goto("/templates/pricing-page");
    const frame = page.frameLocator("iframe");
    await frame.locator("[data-ready]").waitFor({ state: "attached", timeout: 20_000 });

    await page.getByLabel("Product name").fill("Tidewater");
    await expect(frame.locator("header").first()).toContainText("Tidewater");
    await page.getByRole("checkbox", { name: "FAQ" }).uncheck();
    await expect(frame.getByRole("heading", { name: "Questions about plans" })).toHaveCount(0);

    const checks = page.locator("section", { hasText: "Page checks" }).locator("li");
    await expect(checks.first()).toContainText("One h1 on the page");
    await expect(checks.filter({ hasText: /^Look/ })).toHaveCount(0);

    await page.getByText("One HTML file", { exact: true }).click();
    await expect(page.frameLocator("iframe").locator("header").first()).toContainText("Tidewater");
    await expect(checks.first()).toContainText("One h1 on the page");
    await expect(checks.filter({ hasText: /^Look/ })).toHaveCount(0);

    // The page in the frame is tested on its own above; axe would read its landmarks as the editor's.
    const { violations } = await new AxeBuilder({ page }).exclude("iframe").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(violations.map((v) => v.id)).toEqual([]);
  });

  test("a pale brand colour is called out, not hidden", async ({ page }) => {
    await page.goto("/templates/landing-page");
    await page.frameLocator("iframe").locator("[data-ready]").waitFor({ state: "attached", timeout: 20_000 });
    await page.getByLabel("Brand colour").fill("#fde68a");
    await expect(page.locator("section", { hasText: "Page checks" }).locator("li").filter({ hasText: "only" })).toContainText(
      /Your colour as text on the page is only 1\.\d:1/,
    );
  });
});
