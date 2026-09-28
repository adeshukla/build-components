import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers";

/** Waits for React to be listening, so nothing is typed into a field that is still server-rendered. */
async function ready(page: Page, path: string) {
  await page.goto(path);
  await page.locator("[data-ready]").first().waitFor({ state: "attached", timeout: 15_000 });
}

/**
 * Clicks a control by its label, which is what a person does. Every switch and radio on these pages is a
 * visually hidden input under a styled label, so the input itself is a 1px target Playwright cannot hit.
 */
const byLabel = (page: Page, selector: string) => page.locator(`label:has(${selector})`);

const pages = [
  ["/parts", "Parts catalogue"],
  ["/in-use", "What they look like together"],
  ["/tested", "Tested, not asserted"],
  ["/start", "Take a part"],
] as const;

/** The site's own pages get the same axe and keyboard treatment the parts do. */
for (const [path, heading] of pages) {
  test.describe(`${path}`, () => {
    test("has one h1, and no axe violations", async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
      await expectNoAxeViolations(page);
    });

    test("is reachable from the header on every other page", async ({ page }) => {
      await page.goto("/");
      // On a phone the links live behind the Menu button, which is the only way to reach them there.
      const menu = page.getByRole("button", { name: "Menu" });
      if (await menu.isVisible()) await menu.click();
      const link = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: nameFor(path) });
      await expect(link.first()).toHaveAttribute("href", path);
    });
  });
}

function nameFor(path: string) {
  return {
    "/parts": "Catalogue",
    "/in-use": "In use",
    "/tested": "How it is tested",
    "/start": "Get started",
  }[path] as string;
}

test.describe("the catalogue page", () => {
  test("lists every part, not just the first few", async ({ page }) => {
    await ready(page, "/parts");
    /*
     * The home page shows the first eight and links here for the rest. It used to carry a "Show all"
     * button of its own as well, directly above that link — two buttons for one idea — so neither
     * page has one now, and this is the guard against it coming back.
     */
    await expect(page.getByRole("button", { name: /^Show all / })).toHaveCount(0);
    const cards = page.getByRole("listitem");
    expect(await cards.count()).toBeGreaterThan(100);
  });

  test("a search narrows it and goes into the address bar, so a list can be sent to someone", async ({ page }) => {
    await ready(page, "/parts");
    await page.getByRole("searchbox", { name: /Search the catalogue/ }).fill("dialog");
    await expect(page.getByRole("status").first()).toContainText("matching “dialog”");
    await expect.poll(() => new URL(page.url()).searchParams.get("q")).toBe("dialog");
  });

  test("a shared search arrives already applied", async ({ page }) => {
    await ready(page, "/parts?q=upload");
    await expect(page.getByRole("searchbox", { name: /Search the catalogue/ })).toHaveValue("upload");
    await expect(page.getByRole("status").first()).toContainText("matching “upload”");
  });

  test("a type filter arrives applied too, and is cleared from the URL when it goes back to All", async ({ page }) => {
    await ready(page, "/parts?type=Overlays");
    await expect(page.getByRole("radio", { name: /^Overlays/ })).toBeChecked();
    await byLabel(page, 'input[value="All"]').click();
    await expect.poll(() => new URL(page.url()).searchParams.get("type")).toBeNull();
  });
});

const screenTabs = ["A product page", "A checkout", "An admin screen"];

test.describe("the in-use page", () => {
  const tabs = (page: Page) => page.getByRole("tablist", { name: /Screens built/ });

  test("is a real tablist: arrows move it and only one screen is rendered", async ({ page }) => {
    await ready(page, "/in-use");
    await expect(tabs(page).getByRole("tab")).toHaveCount(3);
    await expect(page.getByRole("tab", { name: screenTabs[0] })).toHaveAttribute("aria-selected", "true");
    await page.getByRole("tab", { name: screenTabs[0] }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: screenTabs[1] })).toBeFocused();
    await expect(page.getByRole("tab", { name: screenTabs[1] })).toHaveAttribute("aria-selected", "true");
    // Only the chosen screen exists: the others are not rendered at all.
    await expect(page.getByRole("heading", { name: /A checkout, five parts deep/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /seven parts deep/ })).toHaveCount(0);
  });

  test("the screens are made of the real parts, running", async ({ page }) => {
    await ready(page, "/in-use");
    // The hero's own heading, from the exported component rather than from this page.
    await expect(page.locator('[data-part="hero"]')).toBeVisible();
    await expect(page.locator("[data-part]")).toHaveCount(7);
  });

  test("the X-ray names every part and links to it, and changes nothing else", async ({ page }) => {
    await ready(page, "/in-use");
    const xray = page.getByRole("switch", { name: /X-ray/ });
    await expect(xray).not.toBeChecked();
    await expect(page.locator('[data-part="hero"]').getByRole("link", { name: "Hero" })).toHaveCount(0);

    /*
     * Measured against the document, not the viewport: boundingBox is viewport-relative, so on a phone
     * any scroll from the click would look like the layout moving.
     */
    const whereIsTheGrid = () =>
      page
        .locator('[data-part="feature-grid"]')
        .evaluate((node) => Math.round(node.getBoundingClientRect().top + window.scrollY));

    const before = await whereIsTheGrid();
    await byLabel(page, 'input[role="switch"]').click();
    await expect(page.locator('[data-part="hero"]').getByRole("link", { name: "Hero" })).toHaveAttribute("href", "/hero");
    // Drawn over the parts, not around them: turning it on must not move anything.
    expect(Math.abs((await whereIsTheGrid()) - before)).toBeLessThan(2);
  });

  test("every screen is clean with the X-ray on", async ({ page }) => {
    await ready(page, "/in-use");
    await byLabel(page, 'input[role="switch"]').click();
    for (const tab of screenTabs) {
      await page.getByRole("tab", { name: tab }).click();
      await expectNoAxeViolations(page);
    }
  });
});

test.describe("the tested page", () => {
  test("the tracer numbers the real tab order, and says how many in words", async ({ page }) => {
    await ready(page, "/tested");
    await page.getByRole("button", { name: "Number the tab stops" }).click();
    // The menu bar's whole claim: three menus, nine items, one stop.
    await expect(page.locator("[data-count]")).toHaveText("1 tab stop in menu bar.");
    // The one stop is the File menu; "Document" is the bar's own name, which is not a stop.
    await expect(page.getByRole("list").filter({ hasText: "File" }).first()).toBeVisible();
  });

  test("switching the traced part clears the old numbers rather than keeping them", async ({ page }) => {
    await ready(page, "/tested");
    await page.getByRole("button", { name: "Number the tab stops" }).click();
    await expect(page.locator("[data-count]")).toContainText("1 tab stop");
    await byLabel(page, 'input[value="address-fields"]').click();
    await expect(page.locator("[data-count]")).toHaveText("");
    await page.getByRole("button", { name: "Number the tab stops" }).click();
    // One stop per field, which is the opposite claim and the point of the comparison.
    await expect(page.locator("[data-count]")).toContainText("tab stops in address fields.");
  });

  test("the contrast meter runs the parts' own correction", async ({ page }) => {
    await ready(page, "/tested");
    const table = page.getByRole("table", { name: /before and after correction/ });
    // The gold default fails on white as it is, and the corrected row passes.
    await expect(table.getByRole("row").filter({ hasText: "As you picked it, on white" })).toContainText("Fails");
    await expect(table.getByRole("row").filter({ hasText: "Corrected, on white" })).toContainText("Passes");
  });

  test("pass and fail are words, not only colours", async ({ page }) => {
    await ready(page, "/tested");
    const table = page.getByRole("table", { name: /before and after correction/ });
    await expect(table.getByText("Passes").first()).toBeVisible();
    await expect(table.getByText("Fails").first()).toBeVisible();
  });
});

test.describe("the get-started page", () => {
  test("gives a real install command and does not imply a licence it has not got", async ({ page }) => {
    await page.goto("/start");
    await expect(page.getByText("npx shadcn@latest add", { exact: false })).toContainText("/r/date-picker.json");
    await expect(page.getByText("[TODO: no licence has been chosen", { exact: false })).toBeVisible();
  });
});
