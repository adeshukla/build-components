import { expect, test, type Locator, type Page } from "@playwright/test";
import { encodePage, MAX_SECTIONS, newSection, suggestions, type BuiltPage } from "../lib/page-builder";
import { inStock } from "../lib/parts";
import { isRegistrySlug } from "../lib/registry";
import { decodeSite, encodeSite, siteFrom, siteFromStarter } from "../lib/site-builder";
import { expectNoAxeViolations } from "./helpers";

/*
 * The page builder (D80, D83): building by click, by drag (mouse and touch) and by keyboard, keeping the page, and what it gives back.
 * Then the promise that matters most: whatever parts someone puts on a page, it fits a 300px screen, in
 * both outputs.
 */

const pageList = (page: Page) => page.getByRole("list", { name: "Parts on your page, in order" });
const rows = (page: Page) => pageList(page).locator("li");
const add = (page: Page, name: string) => page.getByRole("button", { name: `Add ${name}`, exact: true }).click();

test.describe("building", () => {
  test.skip(({ browserName, isMobile }) => browserName !== "chromium" || isMobile, "Chromium only: plain layout");
  test.use({ viewport: { width: 1440, height: 1000 } });

  /** Drags with the mouse, the way a person does: press, move in steps, let go. */
  async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 20 });
    await page.mouse.up();
  }
  async function middle(locator: Locator, down = 0.5) {
    const box = (await locator.boundingBox())!;
    return { x: box.x + box.width / 2, y: box.y + box.height * down };
  }

  test("a template starts the page in one click", async ({ page }) => {
    await page.goto("/build");
    await page.getByRole("button", { name: /^Pricing page/ }).click();
    await expect(rows(page).first()).toContainText("Site header");
    await expect(page.frameLocator('iframe[title="Your page, React output"]').locator("[data-part]").first()).toBeVisible({ timeout: 15_000 });
  });

  test("parts go on by click and by drag onto the page, move by keyboard, and come off", async ({ page }) => {
    await page.goto("/build");
    await add(page, "Site header");
    await add(page, "FAQ");
    await add(page, "Site footer");
    // A click adds below the chosen section; the footer stays last whatever is added after it.
    await add(page, "Page header");
    await expect(rows(page)).toHaveText([/Site header/, /FAQ/, /Page header/, /Site footer/]);

    // Dragged onto the page itself: dropped on the top of the FAQ, it goes in above it.
    await page.getByLabel("Search the parts").fill("pricing");
    const frame = page.frameLocator('iframe[title="Your page, React output"]');
    const faq = frame.locator('[data-part="faq"]');
    await faq.waitFor();
    const frameBox = (await page.locator('iframe[title="Your page, React output"]').boundingBox())!;
    const faqBox = (await faq.boundingBox())!;
    await drag(page, await middle(page.getByRole("button", { name: "Add Pricing table", exact: true })), {
      x: frameBox.x + frameBox.width / 2,
      y: faqBox.y + 10,
    });
    await expect(rows(page)).toHaveText([/Site header/, /Pricing table/, /FAQ/, /Page header/, /Site footer/]);

    // And in the layers list, by its handle: the page header to the top of main.
    const handle = rows(page).filter({ hasText: "Page header" }).locator("span[aria-hidden]").first();
    await drag(page, await middle(handle), await middle(rows(page).nth(1), 0.1));
    await expect(rows(page)).toHaveText([/Site header/, /Page header/, /Pricing table/, /FAQ/, /Site footer/]);

    // Move down keeps focus on the button, so it can be pressed again.
    await pageList(page).getByRole("button", { name: "Move Page header down" }).click();
    await page.keyboard.press("Enter");
    await expect(rows(page)).toHaveText([/Site header/, /Pricing table/, /FAQ/, /Page header/, /Site footer/]);
    await expect(pageList(page).getByRole("button", { name: "Move Page header down" })).toBeFocused();

    await pageList(page).getByRole("button", { name: "Remove Pricing table" }).click();
    await expect(rows(page)).toHaveCount(4);
    await expect(pageList(page).getByRole("button", { name: "Remove FAQ" })).toBeFocused();

    // Clicking a section on the page chooses it; its options reach the page.
    await faq.click();
    await expect(pageList(page).getByRole("button", { name: /Options for FAQ/ })).toHaveAttribute("aria-pressed", "true");
    await rows(page).filter({ hasText: "Page header" }).getByRole("button", { name: /Options for/ }).click();
    await page.getByRole("textbox", { name: "Title", exact: true }).fill("Everything about Northwind");
    await expect(frame.getByRole("heading", { level: 1 })).toHaveText("Everything about Northwind", { timeout: 15_000 });
    await expect(page.getByRole("button", { name: /Get the code/ })).toContainText("checks pass");
    await expectNoAxeViolations(page);
  });

  test("the page is kept in this browser, and travels as a link", async ({ page, browser }) => {
    await page.goto("/build");
    await add(page, "FAQ");
    await add(page, "Newsletter signup");
    await page.reload();
    await expect(rows(page)).toHaveText([/FAQ/, /Newsletter/]);

    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByRole("button", { name: /Get the code/ }).click();
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
    // The link is read (and its page decompressed) before the builder shows: allow it the time.
    await expect(rows(page).first()).toContainText("Site header", { timeout: 15_000 });
    await expect(rows(page).last()).toContainText("Site footer");
  });
});

test("on a touch screen, a part is dragged onto the page by its handle", async ({ page, browserName, isMobile }) => {
  test.skip(browserName !== "chromium" || !isMobile, "Touch in Chromium: the touches are sent through CDP");
  await page.goto("/build");
  await page.getByRole("button", { name: /^Landing page/ }).tap();
  await expect(rows(page)).toHaveCount(6);
  const cdp = await page.context().newCDPSession(page);
  const touch = (type: "touchStart" | "touchMove" | "touchEnd", x = 0, y = 0) =>
    cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
  const tile = page.locator("li").filter({ has: page.getByRole("button", { name: "Add FAQ", exact: true }) });
  await tile.scrollIntoViewIfNeeded();
  const grip = (await tile.locator("span[aria-hidden]").last().boundingBox())!;
  const frame = (await page.locator('iframe[title="Your page, React output"]').boundingBox())!;
  const from = { x: grip.x + grip.width / 2, y: grip.y + grip.height / 2 };
  const to = { x: frame.x + frame.width / 2, y: Math.min(frame.y + 80, page.viewportSize()!.height - 60) };
  await touch("touchStart", from.x, from.y);
  for (let step = 1; step <= 20; step++) await touch("touchMove", from.x + ((to.x - from.x) * step) / 20, from.y + ((to.y - from.y) * step) / 20);
  await touch("touchEnd");
  await expect(rows(page)).toHaveCount(7);
});

test.describe("a website", () => {
  test.skip(({ browserName, isMobile }) => browserName !== "chromium" || isMobile, "Chromium only: plain layout");
  test.use({ viewport: { width: 1440, height: 1000 } });
  const frameOf = (page: Page) => page.frameLocator('iframe[title="Your page, React output"]');
  const pages = (page: Page) => page.getByRole("group", { name: "Pages" }).getByRole("button");

  async function addPage(page: Page, title: string, address: string, template: RegExp) {
    await page.getByRole("button", { name: "+ Add a page" }).click();
    await expect(page.getByLabel("Page name")).toBeFocused();
    await page.getByLabel("Page name").fill(title);
    await page.getByRole("textbox", { name: /^Address/ }).fill(address);
    await page.getByRole("textbox", { name: /^Address/ }).blur();
    await page.getByRole("button", { name: template }).click();
  }

  test("pages share the header and footer, the menu lists them, and its links go to them", async ({ page, request }) => {
    await page.goto("/build");
    await page.getByRole("button", { name: /^Landing page/ }).click();
    await addPage(page, "Pricing", "pricing", /^Pricing page/);
    await addPage(page, "About us", "about", /^About page/);
    await expect(pages(page)).toHaveText([/^Home/, /^Pricing/, /^About us/, "+ Add a page"]);

    // One header for every page, listing the pages; a page's own sections stay its own.
    const header = frameOf(page).locator('[data-part="header"]');
    await expect(header.getByRole("link", { name: "Pricing" }).first()).toHaveAttribute("href", "/pricing");
    await expect(header.getByRole("link", { name: "About us" }).first()).toHaveAttribute("href", "/about");
    await expect(pageList(page).getByText("Every page")).toHaveCount(2);
    await expect(frameOf(page).locator('[data-part="team-grid"]')).toBeVisible();
    await pages(page).filter({ hasText: "Home" }).click();
    await expect(frameOf(page).locator('[data-part="team-grid"]')).toHaveCount(0);

    // In the preview, the menu goes to the site's own page.
    await page.getByRole("button", { name: "Preview", exact: true }).click();
    await header.getByRole("link", { name: "Pricing" }).first().click();
    await expect(frameOf(page).locator('[data-part="pricing-table"]')).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(pages(page).filter({ hasText: "Pricing" })).toHaveAttribute("aria-pressed", "true");

    // Kept in this browser.
    await page.reload();
    await expect(pages(page)).toHaveCount(4);

    // And taken home whole: a route per page, an HTML file per page, linked to one another.
    await page.getByRole("button", { name: /Get the code/ }).click();
    const href = await page.getByRole("link", { name: "Download a Next.js project" }).getAttribute("href");
    const files = await (await request.get(href!.replace(".zip?", ".json?"))).json();
    expect(Object.keys(files)).toEqual(expect.arrayContaining(["app/page.tsx", "app/pricing/page.tsx", "app/about/page.tsx", "components/header.tsx"]));
    const htmlFiles = await (await request.get(href!.replace(".zip?", "-html.json?"))).json();
    expect(Object.keys(htmlFiles).sort()).toEqual(["about.html", "index.html", "pricing.html"]);
    expect(htmlFiles["index.html"]).toContain('href="pricing.html"');
  });

  test("a page can be renamed, readdressed and deleted; the home page stays /", async ({ page }) => {
    await page.goto("/build");
    await page.getByRole("button", { name: /^Landing page/ }).click();
    // A template chooses its first section; Page settings is one step back.
    await page.getByRole("button", { name: "Page settings" }).click();
    await expect(page.getByRole("textbox", { name: /^Address/ })).toHaveAttribute("readonly", "");
    await addPage(page, "Contact", "Get in touch!", /^Contact page/);
    await page.getByRole("button", { name: "Page settings" }).click();
    await expect(page.getByRole("textbox", { name: /^Address/ })).toHaveValue("/get-in-touch");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete this page" }).click();
    await expect(pages(page)).toHaveText([/^Home/, "+ Add a page"]);
    await expect(pages(page).first()).toBeFocused();
  });

  test("a whole website starts in one click, every page from a template, linked from the menu (D88)", async ({ page }) => {
    await page.goto("/build");
    await page.getByRole("button", { name: /^Company website/ }).click();
    await expect(pages(page)).toHaveText([/^Home/, /^About/, /^Team/, /^Careers/, /^FAQ/, /^Contact/, "+ Add a page"]);
    const header = frameOf(page).locator('[data-part="header"]');
    await expect(header.getByRole("link", { name: "Careers" }).first()).toHaveAttribute("href", "/careers");
    await pages(page).filter({ hasText: "Careers" }).click();
    await expect(frameOf(page).getByRole("heading", { level: 1 })).toHaveText("Careers");
    await expect(frameOf(page).getByRole("heading", { name: "Open roles" })).toBeVisible();

    // Once there is work on the page, starting another website asks first.
    page.once("dialog", (dialog) => dialog.dismiss());
    await page.getByLabel("Fill this page from").selectOption({ label: "Launch website (3 pages)" });
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await expect(pages(page)).toHaveCount(7);
  });

  test("suggestions fill what a page is missing, then what usually comes next (D88)", async ({ page }) => {
    await page.goto("/build");
    const suggested = page.locator("h3", { hasText: "Suggested" }).locator("+ ul").getByRole("button");
    await expect(suggested).toHaveText([/^Site header/, /^Hero section.*main heading/, /^Page header/]);
    await suggested.filter({ hasText: "Hero section" }).click();
    await expect(rows(page)).toHaveCount(1);
    // A hero is followed by a feature grid in the landing, home and services templates.
    await expect(suggested.filter({ hasText: "Feature grid" })).toContainText("Often follows Hero section");
    await expect(suggested.filter({ hasText: "Site footer" })).toContainText("Every page ends with one");
    await suggested.filter({ hasText: "Feature grid" }).click();
    await expect(pageList(page)).toContainText("Feature grid");
    await expect(suggested.filter({ hasText: /^Feature grid/ })).toHaveCount(0);
  });
});

test("suggestions come from the templates, and never offer what is on the page", () => {
  const blogPage = built(["header", "page-header", "post-list", "newsletter", "footer"]);
  const offered = suggestions(blogPage, null);
  expect(offered.length).toBeGreaterThan(0);
  for (const { slug } of offered) expect(blogPage.sections.map((section) => section.slug)).not.toContain(slug);
  // Nothing follows a newsletter in any template; the closest templates fill in.
  expect(offered[0].why).toMatch(/^In the .+ template$/);
  // A page without its banner, heading or footer hears about those first.
  expect(suggestions(built(["faq"]), "faq").slice(0, 3).map((suggestion) => suggestion.slug)).toEqual(["header", "page-header", "footer"]);
});

/** A page of the given parts, as the builder would write it. */
const built = (slugs: string[]): BuiltPage => ({
  name: "Northwind",
  brand: "#2563eb",
  theme: "light",
  sections: slugs.filter(isRegistrySlug).map(newSection),
});

test.describe("controlling the page", () => {
  test.skip(({ browserName, isMobile }) => browserName !== "chromium" || isMobile, "Chromium only: plain layout");
  test.use({ viewport: { width: 1440, height: 1000 } });
  const frameOf = (page: Page) => page.frameLocator('iframe[title="Your page, React output"]');

  test("a section's width and spacing reach the page, the page.tsx and the HTML file", async ({ page, request }) => {
    await page.goto("/build");
    await page.getByRole("button", { name: /^Landing page/ }).click();
    await pageList(page).getByRole("button", { name: /Options for Feature grid/ }).click();
    await page.getByLabel("Width").selectOption("narrow");
    await page.getByLabel("Space above and below").selectOption("large");
    const grid = frameOf(page).locator('[data-part="feature-grid"] > div');
    // Large spacing, scaled by the theme's spacing (D87).
    await expect(grid).toHaveClass(/py-\[calc\(5rem\*var\(--bc-space,1\)\)\]/);
    await expect(grid.locator("> div")).toHaveClass(/max-w-2xl/);

    // The same choice in what is taken home, through the page's link.
    await page.getByRole("button", { name: /Get the code/ }).click();
    await page.getByRole("radio", { name: "page.tsx" }).check({ force: true });
    await expect(page.getByLabel("Code, scrollable")).toContainText('<div className="px-6 sm:px-8 py-[calc(5rem*var(--bc-space,1))]">');
    const zipHref = await page.getByRole("link", { name: "Download one HTML file" }).getAttribute("href");
    const html = await (await request.get(zipHref!)).text();
    expect(html).toContain('<div class="tpl-px tpl-py-large"><div class="tpl-max-narrow">');
  });

  test("a short page keeps its footer at the bottom, in both outputs", async ({ page, request }) => {
    const short = encodePage(built(["header", "badge", "footer"]));
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/preview-page#p=${short}`);
    await expect(page.locator('[data-part="footer"]')).toBeVisible();
    const reactBottom = await page.locator('[data-part="footer"]').evaluate((el) => el.getBoundingClientRect().bottom);
    expect(Math.round(reactBottom)).toBe(900);
    await page.setContent(await (await request.get(`/download/page.html?p=${short}`)).text());
    const htmlBottom = await page.locator("footer").last().evaluate((el) => el.getBoundingClientRect().bottom);
    expect(Math.round(htmlBottom)).toBeGreaterThanOrEqual(899);
  });

  test("a picture, chosen or dropped, shows on the page and goes into both downloads", async ({ page }) => {
    // A real one-pixel PNG.
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==", "base64");
    await page.goto("/build");
    await page.getByRole("button", { name: /^Landing page/ }).click();
    await page.getByLabel("Choose a picture: Picture").setInputFiles({ name: "yard.png", mimeType: "image/png", buffer: png });
    const hero = frameOf(page).locator('[data-part="hero"] img');
    await expect.poll(() => hero.evaluate((img: HTMLImageElement) => img.naturalWidth), { timeout: 15_000 }).toBe(1);

    // Dropped onto a section from the computer: it goes in that section's first empty picture.
    await add(page, "Image gallery");
    await frameOf(page).locator('[data-part="image-gallery"]').waitFor();
    await page.frames()[1].evaluate((bytes) => {
      const data = new DataTransfer();
      data.items.add(new File([new Uint8Array(bytes)], "drop.png", { type: "image/png" }));
      const target = document.querySelector('[data-part="image-gallery"] *')!;
      for (const type of ["dragenter", "dragover", "drop"]) target.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: data }));
    }, [...png]);
    await expect(frameOf(page).locator('[data-part="image-gallery"] img[src^="https://assets.invalid/"]')).toHaveCount(1, { timeout: 15_000 });

    await page.getByRole("button", { name: /Get the code/ }).click();
    const [project] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download a Next.js project" }).click()]);
    const zip = (await import("node:fs")).readFileSync((await project.path())!).toString("latin1");
    expect(new Set(zip.match(/public\/images\/[a-z0-9]{16}\.png/g)).size).toBe(2);
    expect(zip).not.toContain("assets.invalid");
    const [file] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download one HTML file" }).click()]);
    const html = (await import("node:fs")).readFileSync((await file.path())!, "utf8");
    expect(html.match(/data:image\/png;base64/g)).toHaveLength(2);
    await expect(page.getByLabel("Code, scrollable")).not.toContainText("assets.invalid");
  });

  test("clicking text on the page goes to the field that holds it", async ({ page }) => {
    await page.goto("/build");
    await page.getByRole("button", { name: /^Landing page/ }).click();
    await frameOf(page).getByRole("heading", { level: 1 }).click();
    await expect(page.getByRole("textbox", { name: "Heading", exact: true })).toBeFocused();
  });

  test("the preview fills the screen, its links stay on the page, and Escape closes it", async ({ page }) => {
    await page.goto("/build");
    await page.getByRole("button", { name: /^Landing page/ }).click();
    await page.getByRole("button", { name: "Preview", exact: true }).click();
    const preview = page.getByRole("dialog", { name: "Preview of your page" });
    await expect(preview).toBeVisible();
    await expect(page.getByRole("button", { name: "Close preview" })).toBeFocused();
    await frameOf(page).getByRole("link", { name: "Pricing" }).first().click();
    await expect(page.getByText("On your site, this goes to /pricing")).toBeVisible();
    expect(page.frames()[1].url()).toContain("/preview-page");
    await page.keyboard.press("Escape");
    await expect(preview).toBeHidden();
    await expect(page.getByRole("button", { name: "Preview", exact: true })).toBeFocused();
  });
});

test.describe("what a page gives back", () => {
  test.skip(({ browserName, isMobile }) => browserName !== "chromium" || isMobile, "Chromium only: server output");

  test("a Next.js project, one HTML file and a shadcn item", async ({ request }) => {
    const p = encodePage(built(["header", "searchable-select", "faq", "footer"]));
    const zip = await request.get(`/download/northwind.zip?p=${p}`);
    expect(zip.headers()["content-type"]).toBe("application/zip");
    const bytes = await zip.body();
    expect(bytes.subarray(0, 2).toString()).toBe("PK");
    // The shared header and footer are components/<part>; a page's own parts are in components/<page>/.
    for (const file of ["package.json", "app/layout.tsx", "app/page.tsx", "components/header.tsx", "components/home/searchable-select.tsx", "README.md"]) {
      expect(bytes.includes(Buffer.from(file)), file).toBe(true);
    }

    const html = await (await request.get(`/download/northwind.html?p=${p}`)).text();
    expect(html.match(/<main/g)).toHaveLength(1);
    expect(html).toContain("data-searchable-select");

    const item = await (await request.get(`/r/pages/northwind.json?p=${p}`)).json();
    expect(item.type).toBe("registry:block");
    expect(item.files.map((file: { target: string }) => file.target)).toEqual(
      expect.arrayContaining(["app/page.tsx", "components/header.tsx", "components/home/searchable-select.tsx", "components/home/faq.tsx", "components/footer.tsx"]),
    );
    expect(item.files[0].content).toContain('import { SearchableSelect } from "@/components/home/searchable-select";');
  });

  test("a shop website with its address gives a sitemap, page metadata and forms that send (D95, D96, D97)", async ({ request }) => {
    const shop = siteFromStarter("shop", { name: "Northwind", brand: "#16303f", theme: "light" })!;
    const site = {
      ...shop,
      url: "https://northwind.example",
      pages: shop.pages.map((page) => (page.path === "/product" ? { ...page, description: "A waxed cotton jacket.", image: "https://northwind.example/jacket.jpg" } : page)),
    };
    const p = await encodeSite(site);
    // The link carries the new settings, and reads them back checked.
    expect((await decodeSite(p))?.pages.find((page) => page.path === "/product")?.description).toBe("A waxed cotton jacket.");

    const next: Record<string, string> = await (await request.get(`/download/northwind.json?p=${p}`)).json();
    expect(next["app/sitemap.ts"]).toContain('"https://northwind.example/product"');
    expect(next["app/robots.ts"]).toContain("https://northwind.example/sitemap.xml");
    expect(next["app/layout.tsx"]).toContain('metadataBase: new URL("https://northwind.example")');
    expect(next["app/product/page.tsx"]).toContain('description: "A waxed cotton jacket."');
    expect(next["app/product/page.tsx"]).toContain('openGraph: { images: ["https://northwind.example/jacket.jpg"] }');
    // A form left with nowhere to send posts to the project's own endpoint.
    expect(next["app/api/forms/route.ts"]).toContain("FORM_WEBHOOK_URL");
    expect(next["components/contact/form.tsx"]).toContain('"action": "/api/forms"');
    expect(next["components/home/product-grid.tsx"]).toContain('"href": "/product"');

    const html: Record<string, string> = await (await request.get(`/download/northwind-html.json?p=${p}`)).json();
    expect(html["sitemap.xml"]).toContain("<loc>https://northwind.example/product.html</loc>");
    expect(html["robots.txt"]).toContain("Sitemap: https://northwind.example/sitemap.xml");
    expect(html["product.html"]).toContain('<meta name="description" content="A waxed cotton jacket.">');
    expect(html["product.html"]).toContain('<link rel="canonical" href="https://northwind.example/product.html">');
  });

  test("a website's address and pictures must be web addresses", () => {
    const bad = siteFrom({ u: "javascript:alert(1)", pages: [{ i: "home", t: "Home", p: "/", s: [], g: "data:image/png;base64,AAAA", d: "x".repeat(400) }] })!;
    expect(bad.url).toBeUndefined();
    expect(bad.pages[0].image).toBeUndefined();
    expect(bad.pages[0].description).toHaveLength(160);
    expect(siteFrom({ u: "northwind.example/shop", pages: [{ i: "home", t: "Home", p: "/", s: [] }] })!.url).toBe("https://northwind.example");
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
