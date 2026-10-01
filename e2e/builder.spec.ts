import { expect, test, type Page } from "@playwright/test";
import { encodePage, MAX_SECTIONS, newSection, type BuiltPage } from "../lib/page-builder";
import { inStock } from "../lib/parts";
import { isRegistrySlug } from "../lib/registry";
import { expectNoAxeViolations } from "./helpers";

/*
 * The page builder (D80): building by drag and by keyboard, keeping the page, and what it gives back.
 * Then the promise that matters most: whatever parts someone puts on a page, it fits a 300px screen, in
 * both outputs.
 */

const pageList = (page: Page) => page.getByRole("list", { name: "Parts on your page, in order" });
const rows = (page: Page) => pageList(page).locator("li");
const add = (page: Page, name: string) => page.getByRole("button", { name: `Add ${name}`, exact: true }).click();

test.describe("building", () => {
  test.skip(({ browserName, isMobile }) => browserName !== "chromium" || isMobile, "Chromium only: plain layout and HTML5 drag");
  // Tall enough that a drag's start and end are on screen together.
  test.use({ viewport: { width: 1280, height: 1400 } });

  test("parts go on by button and by drag, move by keyboard, and come off", async ({ page }) => {
    await page.goto("/build");
    await add(page, "Site header");
    await add(page, "FAQ");
    await add(page, "Site footer");
    // The footer stays last whatever is added after it.
    await add(page, "Page header");
    await expect(rows(page)).toHaveText([/Site header/, /FAQ/, /Page header/, /Site footer/]);

    await page.getByLabel("Search the parts").fill("pricing");
    // Clicking Add scrolled the window to each button; a drag needs both ends on screen from the start.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator("li[draggable]").filter({ hasText: "Pricing table" }).dragTo(rows(page).nth(1), { targetPosition: { x: 40, y: 2 } });
    await expect(rows(page)).toHaveText([/Site header/, /Pricing table/, /FAQ/, /Page header/, /Site footer/]);

    // Move up keeps focus on the button, so it can be pressed again.
    await page.getByRole("button", { name: "Move Page header up" }).click();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await expect(rows(page)).toHaveText([/Site header/, /Page header/, /Pricing table/, /FAQ/, /Site footer/]);
    await expect(page.getByRole("button", { name: "Move Page header up" })).toBeFocused();

    await page.getByRole("button", { name: "Remove Pricing table" }).click();
    await expect(rows(page)).toHaveCount(4);
    await expect(page.getByRole("button", { name: "Remove FAQ" })).toBeFocused();

    // A part's options reach the page in the frame.
    await rows(page).filter({ hasText: "Page header" }).getByRole("button", { name: /Options for/ }).click();
    const title = page.getByRole("textbox", { name: "Title", exact: true });
    await title.fill("Everything about Northwind");
    const frame = page.frameLocator('iframe[title="Your page, React output"]');
    await expect(frame.getByRole("heading", { level: 1 })).toHaveText("Everything about Northwind", { timeout: 15_000 });
    await expect(page.getByRole("list", { name: "Page checks" })).toContainText("One h1 on the page");
    await expectNoAxeViolations(page);
  });

  test("the page is kept in this browser, and travels as a link", async ({ page, browser }) => {
    await page.goto("/build");
    await add(page, "FAQ");
    await add(page, "Newsletter signup");
    await page.reload();
    await expect(rows(page)).toHaveText([/FAQ/, /Newsletter/]);

    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByRole("button", { name: "Copy a link to this page" }).click();
    const link = await page.evaluate(() => navigator.clipboard.readText());
    const other = await browser.newPage();
    await other.goto(link);
    await expect(rows(other)).toHaveText([/FAQ/, /Newsletter/]);
    await other.close();
  });

  test("a template carries on in the builder with its parts", async ({ page }) => {
    await page.goto("/templates/contact");
    await page.getByRole("link", { name: "Keep building it" }).click();
    await expect(rows(page).first()).toContainText("Site header");
    await expect(rows(page).last()).toContainText("Site footer");
  });
});

/** A page of the given parts, as the builder would write it. */
const built = (slugs: string[]): BuiltPage => ({
  name: "Northwind",
  brand: "#2563eb",
  theme: "light",
  sections: slugs.filter(isRegistrySlug).map(newSection),
});

test.describe("what a page gives back", () => {
  test.skip(({ browserName, isMobile }) => browserName !== "chromium" || isMobile, "Chromium only: server output");

  test("a Next.js project, one HTML file and a shadcn item", async ({ request }) => {
    const p = encodePage(built(["header", "searchable-select", "faq", "footer"]));
    const zip = await request.get(`/download/northwind.zip?p=${p}`);
    expect(zip.headers()["content-type"]).toBe("application/zip");
    const bytes = await zip.body();
    expect(bytes.subarray(0, 2).toString()).toBe("PK");
    for (const file of ["package.json", "app/layout.tsx", "app/page.tsx", "components/searchable-select.tsx", "README.md"]) {
      expect(bytes.includes(Buffer.from(file)), file).toBe(true);
    }

    const html = await (await request.get(`/download/northwind.html?p=${p}`)).text();
    expect(html.match(/<main/g)).toHaveLength(1);
    expect(html).toContain("data-searchable-select");

    const item = await (await request.get(`/r/pages/northwind.json?p=${p}`)).json();
    expect(item.type).toBe("registry:block");
    expect(item.registryDependencies).toHaveLength(4);
    expect(item.files[0].content).toContain('import { SearchableSelect } from "@/components/searchable-select";');
  });

  test("a link it cannot vouch for is refused", async ({ request }) => {
    expect((await request.get("/download/x.zip?p=not-a-page")).status()).toBe(404);
    const unknown = Buffer.from(JSON.stringify({ n: "x", s: [["../../etc/passwd", ""]] })).toString("base64url");
    expect((await request.get(`/download/x.html?p=${unknown}`)).status()).toBe(404);
  });
});

/*
 * Every part someone can put on a page, a page at a time, at 300px: React (the builder's own frame) and
 * the one HTML file. A page that scrolls sideways at 300px fails.
 */
const everyPart = inStock.map((part) => part.slug).filter(isRegistrySlug);
const batches = Array.from({ length: Math.ceil(everyPart.length / MAX_SECTIONS) }, (_, i) =>
  everyPart.slice(i * MAX_SECTIONS, (i + 1) * MAX_SECTIONS),
);

test.describe("every part fits a 300px page", () => {
  test.skip(({ isMobile }) => isMobile, "Width is set by hand here");
  test.describe.configure({ timeout: 120_000 });
  test.use({ viewport: { width: 300, height: 800 } });

  const overflow = (page: Page) =>
    page.evaluate(() => {
      const width = document.documentElement.clientWidth;
      return [...document.querySelectorAll<HTMLElement>("[data-part], body > *")]
        .filter((el) => el.getBoundingClientRect().right > width + 1 || el.scrollWidth > el.clientWidth + 1)
        .map((el) => el.dataset.part ?? el.className.toString().slice(0, 40));
    });

  for (const [index, slugs] of batches.entries()) {
    test(`parts ${index * MAX_SECTIONS + 1} to ${index * MAX_SECTIONS + slugs.length}, React`, async ({ page }) => {
      await page.goto("/preview-page");
      await page.locator("[data-ready]").waitFor({ state: "attached" });
      await page.evaluate((state) => window.postMessage({ type: "built-page", state }, window.location.origin), built(slugs));
      await expect(page.locator("[data-part]")).toHaveCount(slugs.length);
      await page.waitForTimeout(500);
      expect(await page.evaluate(() => document.documentElement.scrollWidth), String(await overflow(page))).toBeLessThanOrEqual(300);
    });

    test(`parts ${index * MAX_SECTIONS + 1} to ${index * MAX_SECTIONS + slugs.length}, HTML`, async ({ page, request }) => {
      const html = await (await request.get(`/download/page.html?p=${encodePage(built(slugs))}`)).text();
      await page.setContent(html);
      await page.waitForTimeout(500);
      expect(await page.evaluate(() => document.documentElement.scrollWidth), String(await overflow(page))).toBeLessThanOrEqual(300);
    });
  }
});
