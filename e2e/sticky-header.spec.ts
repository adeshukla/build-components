import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["sticky-header"].variants);
const header = (page: Page) => page.locator("header");
const scroller = (page: Page) => page.locator("[data-scroller]");

/** Scrolls the header's own scroller and waits for the scroll event, so direction is never a race. */
async function scrollBy(page: Page, amount: number) {
  await page.evaluate(
    (by) =>
      new Promise<void>((resolve) => {
        const node = document.querySelector("header")?.parentElement;
        if (node === null || node === undefined) {
          resolve();
          return;
        }
        node.addEventListener("scroll", () => requestAnimationFrame(() => resolve()), { once: true });
        node.scrollTop += by;
      }),
    amount,
  );
}

/**
 * Two steps rather than one jump. A single scroll event can be coalesced or arrive out of order under
 * load, and the header reads direction from one event to the next; two downward steps say "down"
 * whatever happens to either of them on its own.
 */
async function scrollDown(page: Page) {
  await scrollBy(page, 120);
  await scrollBy(page, 120);
}

for (const target of targets("sticky-header")) {
  test.describe(`shrinking sticky header — ${target.name} export`, () => {
    test("no axe violations for every variant, at the top and scrolled", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await scrollBy(page, 300);
      await expectNoAxeViolations(page);
    });

    test("it is a header landmark with a named nav inside it", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(header(page)).toBeVisible();
      await expect(header(page).getByRole("navigation", { name: "Sections" })).toBeVisible();
      await expect(header(page).getByRole("link")).toHaveCount(4);
    });

    test("it shrinks past the threshold and stops shrinking on the way back", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(header(page)).not.toHaveAttribute("data-shrunk", "true");
      await scrollBy(page, 200);
      await expect(header(page)).toHaveAttribute("data-shrunk", "true");
      await scrollBy(page, -200);
      await expect(header(page)).not.toHaveAttribute("data-shrunk", "true");
    });

    test("it steps out of the way going down and comes back going up", async ({ page }) => {
      await open(page, target.url("default"));
      await scrollDown(page);
      await expect(header(page)).toHaveAttribute("data-away", "true");
      await scrollBy(page, -60);
      await expect(header(page)).not.toHaveAttribute("data-away", "true");
    });

    test("focus inside brings a hidden header back", async ({ page }) => {
      await open(page, target.url("default"));
      await scrollDown(page);
      await expect(header(page)).toHaveAttribute("data-away", "true");
      await header(page).getByRole("button").focus();
      await expect(header(page)).not.toHaveAttribute("data-away", "true");
    });

    test("nothing is removed when it shrinks", async ({ page }) => {
      await open(page, target.url("default"));
      await scrollBy(page, 300);
      await expect(header(page).getByRole("link")).toHaveCount(4);
      await expect(header(page).getByRole("button")).toBeVisible();
    });

    test("the scroller keeps a jumped-to heading clear of the header", async ({ page }) => {
      await open(page, target.url("default"));
      const padding = await scroller(page).evaluate((node) => getComputedStyle(node).scrollPaddingTop);
      expect(Number.parseFloat(padding)).toBeGreaterThan(40);
    });

    test("plain variant: it stays put and never shrinks", async ({ page }) => {
      await open(page, target.url("plain"));
      await scrollBy(page, 300);
      await expect(header(page)).not.toHaveAttribute("data-shrunk", "true");
      await expect(header(page)).not.toHaveAttribute("data-away", "true");
    });
  });
}

test("registry serves the sticky header with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/sticky-header.json?title=Books&threshold=150")).json();
  expect(item).toMatchObject({ name: "sticky-header", type: "registry:component" });
  expect(item.files[0].content).toContain('"title": "Books"');
  expect(item.files[0].content).toContain('"threshold": 150');
});
