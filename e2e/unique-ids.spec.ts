import { expect, test } from "@playwright/test";
import { registry } from "../lib/registry";

/**
 * Two of the same part on one page must not share an element id.
 *
 * An id is a page-wide address: a second copy of it makes every `aria-labelledby`, `aria-controls`
 * and `<label for>` on the page point at the first one, so a label names the wrong field and a menu
 * button opens nothing. `/in-use` puts seven parts on one page, which makes this an ordinary thing
 * to do rather than a corner case.
 *
 * The check is DOM-level, so it says the same thing in every engine; one is enough.
 */
/*
 * Four parts are exempt, because the ids they repeat are the page's own rather than the widget's.
 *
 * A skip link's target id comes from an option, because it has to match the landmark already on your
 * page. Reading progress and the sticky header number the article's headings, which are the fragments
 * a reader copies out of the address bar — "#getting-started" has to stay that. A tour is pointed at
 * selectors you give it. Each of those is a page-level thing, and two of a page inside a page is a
 * contradiction rather than a bug in the part.
 */
const pageLevel = ["skip-links", "reading-progress", "sticky-header", "tour"];

test.describe("element ids belong to their own copy of the part", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "ids do not vary by engine");

  for (const slug of Object.keys(registry).filter((name) => !pageLevel.includes(name))) {
    test(`${slug}: two on one page`, async ({ page }) => {
      await page.goto(`/preview/${slug}?twice=1`);
      const repeated = await page.evaluate(() => {
        const seen = new Map<string, number>();
        for (const element of document.querySelectorAll("[id]")) {
          seen.set(element.id, (seen.get(element.id) ?? 0) + 1);
        }
        return [...seen].filter(([, count]) => count > 1).map(([id, count]) => `${id} x${count}`);
      });
      expect(repeated).toEqual([]);
    });
  }
});
